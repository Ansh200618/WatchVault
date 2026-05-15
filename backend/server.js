const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

const config = {
  tmdbApiKey: process.env.TMDB_API_KEY,
  tmdbReadAccessToken: process.env.TMDB_READ_ACCESS_TOKEN,
  omdbApiKey: process.env.OMDB_API_KEY,
  watchmodeApiKey: process.env.WATCHMODE_API_KEY,
  tmdbBaseUrl: process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3",
  omdbBaseUrl: process.env.OMDB_BASE_URL || "https://www.omdbapi.com",
  anilistBaseUrl: process.env.ANILIST_BASE_URL || "https://graphql.anilist.co",
  jikanBaseUrl: process.env.JIKAN_BASE_URL || "https://api.jikan.moe/v4",
  watchmodeBaseUrl: process.env.WATCHMODE_BASE_URL || "https://api.watchmode.com/v1",
};

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));

const shouldPersistLibrary = process.env.NODE_ENV !== "test";
const dataDir = path.join(__dirname, "data");
const libraryFile = path.join(dataDir, "library.json");

function readStoredLibrary() {
  if (!shouldPersistLibrary) return [];
  try {
    return JSON.parse(fs.readFileSync(libraryFile, "utf8"));
  } catch {
    return [];
  }
}

function persistLibrary() {
  if (!shouldPersistLibrary) return;
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(libraryFile, JSON.stringify(library, null, 2));
}

let library = readStoredLibrary();
const mediaCache = new Map();

function poster(path, size = "w500") {
  return path ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : null;
}

function backdrop(path) {
  return poster(path, "w1280");
}

function yearFromDate(date) {
  return date ? Number(String(date).slice(0, 4)) || null : null;
}

function titleFromTmdb(item) {
  return item.title || item.name || item.original_title || item.original_name || "Untitled";
}

function tmdbKind(item, fallback) {
  if (fallback) return fallback;
  if (item.media_type === "tv" || item.first_air_date) return "tv";
  return "movie";
}

function mediaId(kind, id) {
  return kind === "tv" ? `tmdb:tv:${id}` : `tmdb:movie:${id}`;
}

function cacheMedia(media) {
  if (media?.id) mediaCache.set(media.id, media);
  return media;
}

function hasDetailFields(media) {
  if (!media) return false;
  if (media.kind === "anime") return true;
  if ((media.genres || []).length > 0 || (media.providers || []).length > 0 || media.trailerUrl) return true;
  if (media.kind === "movie") return media.runtimeMinutes !== null && media.runtimeMinutes !== undefined;
  if (media.kind === "tv") return (media.seasonCount || 0) > 0 || (media.episodeCount || 0) > 0;
  return false;
}

function mapTmdbSummary(item, fallbackKind) {
  const kind = tmdbKind(item, fallbackKind);
  const date = kind === "tv" ? item.first_air_date : item.release_date;

  return cacheMedia({
    id: mediaId(kind, item.id),
    kind,
    title: titleFromTmdb(item),
    originalTitle: item.original_title || item.original_name || null,
    year: yearFromDate(date),
    posterUrl: poster(item.poster_path),
    backdropUrl: backdrop(item.backdrop_path || item.poster_path),
    overview: item.overview || null,
    genres: [],
    languages: item.original_language ? [String(item.original_language).toUpperCase()] : [],
    ratings: [{ source: "TMDB", value: item.vote_average ? Number(item.vote_average.toFixed(1)) : null, scale: 10, votes: item.vote_count || null }],
    providers: [],
    trailerUrl: null,
    ...(kind === "movie"
      ? { runtimeMinutes: null, releaseDate: item.release_date || null }
      : {
          firstAirDate: item.first_air_date || null,
          lastAirDate: null,
          episodeRuntimeMinutes: null,
          seasonCount: 0,
          episodeCount: 0,
          status: "Returning",
          seasons: [],
        }),
  });
}

function mapTmdbDetail(item, kind, extra = {}) {
  const summary = mapTmdbSummary({ ...item, media_type: kind }, kind);
  const videos = item.videos?.results || [];
  const trailer = videos.find((video) => video.site === "YouTube" && video.type === "Trailer") || videos[0];
  const regionProviders = item["watch/providers"]?.results?.US || item["watch/providers"]?.results?.IN || {};
  const providerBuckets = [
    ...(regionProviders.flatrate || []).map((provider) => ({ provider, type: "subscription" })),
    ...(regionProviders.free || []).map((provider) => ({ provider, type: "free" })),
    ...(regionProviders.ads || []).map((provider) => ({ provider, type: "ads" })),
    ...(regionProviders.rent || []).map((provider) => ({ provider, type: "rent" })),
    ...(regionProviders.buy || []).map((provider) => ({ provider, type: "buy" })),
  ];
  const ratings = [...summary.ratings, ...(extra.ratings || [])];

  return cacheMedia({
    ...summary,
    genres: Array.isArray(item.genres) ? item.genres.map((genre) => genre.name).filter(Boolean) : [],
    providers: providerBuckets.map(({ provider, type }) => ({
      id: String(provider.provider_id),
      name: provider.provider_name,
      logoUrl: poster(provider.logo_path, "w92"),
      type,
      region: regionProviders === item["watch/providers"]?.results?.IN ? "IN" : "US",
    })),
    ratings,
    trailerUrl: trailer?.key ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
    ...(kind === "movie"
      ? { runtimeMinutes: item.runtime || null, releaseDate: item.release_date || null }
      : {
          firstAirDate: item.first_air_date || null,
          lastAirDate: item.last_air_date || null,
          episodeRuntimeMinutes: Array.isArray(item.episode_run_time) ? item.episode_run_time[0] || null : null,
          seasonCount: item.number_of_seasons || 0,
          episodeCount: item.number_of_episodes || 0,
          status: item.status === "Ended" ? "Ended" : item.status === "Canceled" ? "Canceled" : "Returning",
          seasons: (item.seasons || []).map((season) => ({
            id: `tmdb:tv:${item.id}:season:${season.season_number}`,
            seasonNumber: season.season_number,
            name: season.name || `Season ${season.season_number}`,
            episodeCount: season.episode_count || 0,
            airDate: season.air_date || null,
            posterUrl: poster(season.poster_path),
            watchedCount: 0,
          })),
        }),
  });
}

function mapAniListMedia(item) {
  if (!item) return null;

  const title = item.title?.english || item.title?.romaji || item.title?.native || "Untitled Anime";
  const startYear = item.startDate?.year || null;
  const posterUrl = item.coverImage?.extraLarge || item.coverImage?.large || null;
  const releaseDate = item.startDate?.year
    ? `${item.startDate.year}-${String(item.startDate.month || 1).padStart(2, "0")}-${String(item.startDate.day || 1).padStart(2, "0")}`
    : null;

  return cacheMedia({
    id: `anilist:${item.id}`,
    kind: "anime",
    title,
    originalTitle: item.title?.native || item.title?.romaji || null,
    year: startYear,
    posterUrl,
    backdropUrl: item.bannerImage || posterUrl,
    overview: item.description ? String(item.description).replace(/<[^>]*>/g, "") : null,
    genres: item.genres || [],
    languages: ["JP"],
    ratings: [{ source: "AniList", value: item.averageScore || null, scale: 100, votes: item.popularity || null }],
    providers: [],
    trailerUrl: item.trailer?.site === "youtube" && item.trailer?.id ? `https://www.youtube.com/watch?v=${item.trailer.id}` : null,
    format: item.format === "MOVIE" ? "Movie" : item.format || "TV",
    episodeCount: item.episodes || null,
    durationMinutes: item.duration || null,
    seasons: [
      {
        id: `anilist:${item.id}:season:1`,
        seasonNumber: 1,
        name: item.seasonYear ? `${item.season || "Season"} ${item.seasonYear}` : "Season 1",
        episodeCount: item.episodes || 0,
        airDate: releaseDate,
        posterUrl,
        watchedCount: 0,
      },
    ],
    studio: item.studios?.nodes?.[0]?.name || null,
    source: "anilist",
  });
}

async function tmdbGet(endpoint, params = {}) {
  const headers = {};
  const query = { ...params };

  if (config.tmdbReadAccessToken) {
    headers.Authorization = `Bearer ${config.tmdbReadAccessToken}`;
  } else {
    query.api_key = requireConfigValue(config.tmdbApiKey, "TMDB_API_KEY");
  }

  const url = `${config.tmdbBaseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await axios.get(url, { headers, params: query, timeout: 15000 });
      return response.data;
    } catch (error) {
      lastError = error;
      if (!["ECONNRESET", "ETIMEDOUT", "ECONNABORTED"].includes(error.code)) break;
    }
  }

  throw lastError;
}

async function omdbRatings(imdbId) {
  if (!imdbId || !config.omdbApiKey) return [];

  try {
    const response = await axios.get(config.omdbBaseUrl, {
      params: { i: imdbId, apikey: config.omdbApiKey },
      timeout: 10000,
    });
    const data = response.data || {};
    const ratings = [];

    if (data.imdbRating && data.imdbRating !== "N/A") {
      ratings.push({ source: "IMDb", value: Number(data.imdbRating), scale: 10, votes: data.imdbVotes || null });
    }

    const rt = data.Ratings?.find((rating) => rating.Source === "Rotten Tomatoes")?.Value;
    if (rt && rt.endsWith("%")) ratings.push({ source: "RottenTomatoes", value: Number(rt.replace("%", "")), scale: 100 });
    if (data.Metascore && data.Metascore !== "N/A") ratings.push({ source: "Metacritic", value: Number(data.Metascore), scale: 100 });

    return ratings;
  } catch {
    return [];
  }
}

async function anilistSearch(search, page = 1, perPage = 10) {
  const query = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english native }
          description
          format
          episodes
          duration
          averageScore
          popularity
          genres
          season
          seasonYear
          startDate { year month day }
          coverImage { large extraLarge }
          bannerImage
          trailer { id site }
          studios(isMain: true) { nodes { name } }
        }
      }
    }
  `;
  const response = await axios.post(config.anilistBaseUrl, { query, variables: { search, page, perPage } }, {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    timeout: 15000,
  });
  return (response.data?.data?.Page?.media || []).map(mapAniListMedia).filter(Boolean);
}

async function resolveMediaById(id) {
  if (mediaCache.has(id) && hasDetailFields(mediaCache.get(id))) return mediaCache.get(id);

  const [source, typeOrId, maybeId] = String(id).split(":");

  if (source === "tmdb" && maybeId) {
    const kind = typeOrId === "tv" ? "tv" : "movie";
    const endpoint = kind === "tv" ? `tv/${maybeId}` : `movie/${maybeId}`;
    const detail = await tmdbGet(endpoint, { append_to_response: "videos,watch/providers,external_ids" });
    const imdbId = kind === "movie" ? detail.imdb_id : detail.external_ids?.imdb_id;
    const ratings = await omdbRatings(imdbId);
    return mapTmdbDetail(detail, kind, { ratings });
  }

  if (source === "anilist" && typeOrId) {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          title { romaji english native }
          description
          format
          episodes
          duration
          averageScore
          popularity
          genres
          season
          seasonYear
          startDate { year month day }
          coverImage { large extraLarge }
          bannerImage
          trailer { id site }
          studios(isMain: true) { nodes { name } }
        }
      }
    `;
    const response = await axios.post(config.anilistBaseUrl, { query, variables: { id: Number(typeOrId) } }, {
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      timeout: 15000,
    });
    const media = mapAniListMedia(response.data?.data?.Media);
    if (!media) {
      const error = new Error("Media item not found");
      error.status = 404;
      throw error;
    }
    return media;
  }

  const error = new Error("Media item not found");
  error.status = 404;
  throw error;
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function requireConfigValue(value, name) {
  if (!value) {
    const error = new Error(`${name} is not configured`);
    error.status = 503;
    throw error;
  }
  return value;
}

function externalError(error, serviceName) {
  const status = error.response?.status || 502;
  const details = error.response?.data || error.message;
  return { status, body: { error: `${serviceName} request failed`, details } };
}

function buildPath(req) {
  return req.params[0] || req.params.endpoint || "";
}

function normalizeQuery(query) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function clampProgress(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function realMediaFromLibraryItem(item) {
  return item.media || mediaCache.get(item.mediaId) || null;
}

function totalEpisodesFor(media) {
  if (!media) return 0;
  if (media.kind === "tv") return media.episodeCount || media.seasons?.reduce((sum, season) => sum + (season.episodeCount || 0), 0) || 0;
  if (media.kind === "anime") return media.episodeCount || media.seasons?.reduce((sum, season) => sum + (season.episodeCount || 0), 0) || 0;
  return 0;
}

function runtimeMinutesFor(media) {
  if (!media) return 0;
  if (media.kind === "movie") return media.runtimeMinutes || 0;
  if (media.kind === "tv") return media.episodeRuntimeMinutes || 0;
  return media.durationMinutes || 0;
}

function buildStats() {
  const tracked = library.map((item) => ({ item, media: realMediaFromLibraryItem(item) })).filter(({ media }) => media);
  const completedItems = tracked.filter(({ item }) => item.status === "completed" || clampProgress(item.progressPercent) >= 100);
  const genreCounts = new Map();
  const languageCounts = new Map();
  const monthlyHours = new Map();

  let moviesWatched = 0;
  let episodesWatched = 0;
  let animeCompleted = 0;
  let watchMinutes = 0;

  for (const { item, media } of tracked) {
    const progress = item.status === "completed" ? 100 : clampProgress(item.progressPercent);
    const runtime = runtimeMinutesFor(media);
    const date = new Date(item.updatedAt || item.addedAt || Date.now());
    const month = date.toLocaleString("en-US", { month: "short" });
    let itemMinutes = 0;

    if (media.kind === "movie") {
      if (progress >= 100) moviesWatched += 1;
      itemMinutes = runtime * (progress / 100);
    } else {
      const watchedEpisodes = item.lastEpisode?.episode
        ? Math.max(item.lastEpisode.episode, Math.floor(totalEpisodesFor(media) * (progress / 100)))
        : Math.floor(totalEpisodesFor(media) * (progress / 100));
      episodesWatched += watchedEpisodes;
      itemMinutes = watchedEpisodes * runtime;
      if (media.kind === "anime" && progress >= 100) animeCompleted += 1;
    }

    watchMinutes += itemMinutes;
    monthlyHours.set(month, (monthlyHours.get(month) || 0) + itemMinutes / 60);

    if (progress >= 100 || item.status === "watching" || item.status === "favorite") {
      (media.genres || []).forEach((genre) => genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1));
      (media.languages || []).forEach((language) => languageCounts.set(language, (languageCounts.get(language) || 0) + 1));
    }
  }

  const sortCounts = (map) => [...map.entries()].sort((a, b) => b[1] - a[1]);
  const genreEntries = sortCounts(genreCounts);
  const languageEntries = sortCounts(languageCounts);
  const totalGenreCount = genreEntries.reduce((sum, [, count]) => sum + count, 0);

  return {
    moviesWatched,
    episodesWatched,
    animeCompleted,
    watchHours: Math.round(watchMinutes / 60),
    pendingTitles: library.filter((item) => item.status === "plan").length,
    completionRatePercent: library.length ? Math.round((completedItems.length / library.length) * 100) : 0,
    favoriteGenre: genreEntries[0]?.[0] || null,
    favoriteLanguage: languageEntries[0]?.[0] || null,
    monthlyHours: [...monthlyHours.entries()].map(([m, h]) => ({ m, h: Math.round(h * 10) / 10 })),
    genreDistribution: genreEntries.map(([name, count], index) => ({
      name,
      v: totalGenreCount ? Math.round((count / totalGenreCount) * 100) : 0,
      c: ["#D9A441", "#111111", "#666666", "#9CA3AF", "#F3C76A"][index % 5],
    })),
  };
}

function buildInsights() {
  const stats = buildStats();
  const insights = [];
  const watching = library.find((item) => item.status === "watching" && clampProgress(item.progressPercent) > 0 && clampProgress(item.progressPercent) < 100);
  const planned = library.find((item) => item.status === "plan");

  if (watching) {
    const media = realMediaFromLibraryItem(watching);
    insights.push({
      icon: "NEXT",
      text: media ? `Continue ${media.title} from ${clampProgress(watching.progressPercent)}%` : `Continue a title from ${clampProgress(watching.progressPercent)}%`,
      action: "Open Tracker",
      mediaId: watching.mediaId,
    });
  }

  if (planned) {
    const media = realMediaFromLibraryItem(planned);
    insights.push({
      icon: "PLAN",
      text: media ? `${media.title} is waiting in your plan list` : "A title is waiting in your plan list",
      action: "View Plan",
      mediaId: planned.mediaId,
    });
  }

  if (stats.favoriteGenre) {
    insights.push({
      icon: "TASTE",
      text: `${stats.favoriteGenre} is your strongest watched genre`,
      action: "Discover",
    });
  }

  return insights;
}

async function hydrateLibraryItemMedia(item) {
  if (item.media && hasDetailFields(item.media)) {
    cacheMedia(item.media);
    return item;
  }

  try {
    return { ...item, media: await resolveMediaById(item.mediaId) };
  } catch {
    return item;
  }
}

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", service: "watchvault-backend", timestamp: new Date().toISOString() });
});

app.get("/api/status", (req, res) => {
  res.json({
    apis: {
      TMDB: config.tmdbApiKey || config.tmdbReadAccessToken ? "configured" : "key_missing",
      OMDb: config.omdbApiKey ? "configured" : "key_missing",
      AniList: "public",
      Jikan: "public",
      Watchmode: config.watchmodeApiKey ? "configured" : "key_missing",
    },
  });
});

app.get("/api/media/popular", asyncRoute(async (req, res) => {
  const kind = req.query.kind;
  const requests = [];

  if (!kind || kind === "movie") {
    requests.push(tmdbGet("trending/movie/week").then((data) => (data.results || []).slice(0, 8).map((item) => mapTmdbSummary(item, "movie"))));
  }

  if (!kind || kind === "tv") {
    requests.push(tmdbGet("trending/tv/week").then((data) => (data.results || []).slice(0, 8).map((item) => mapTmdbSummary(item, "tv"))));
  }

  if (!kind || kind === "anime") {
    requests.push(anilistSearch(undefined, 1, 8));
  }

  const results = (await Promise.allSettled(requests))
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter(Boolean)
    .slice(0, 24);

  res.json(results);
}));

app.get("/api/media/search", asyncRoute(async (req, res) => {
  const query = String(req.query.q || "").trim();
  const kind = req.query.kind;

  if (!query) return res.json([]);

  const requests = [];

  if (!kind || kind === "movie" || kind === "tv") {
    requests.push(
      tmdbGet("search/multi", { query, include_adult: false }).then((data) =>
        (data.results || [])
          .filter((item) => item.media_type === "movie" || item.media_type === "tv")
          .filter((item) => (kind ? tmdbKind(item) === kind : true))
          .slice(0, 12)
          .map((item) => mapTmdbSummary(item))
      )
    );
  }

  if (!kind || kind === "anime") {
    requests.push(anilistSearch(query, 1, 8));
  }

  const results = (await Promise.allSettled(requests))
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter(Boolean)
    .slice(0, 20);

  res.json(results);
}));

app.get("/api/media/:id", asyncRoute(async (req, res) => {
  res.json(await resolveMediaById(req.params.id));
}));

app.get("/api/media/:id/season/:seasonNumber", asyncRoute(async (req, res) => {
  const [source, typeOrId, maybeId] = req.params.id.split(":");
  const seasonNumber = Number(req.params.seasonNumber);

  if (source === "tmdb" && typeOrId === "tv" && maybeId) {
    const season = await tmdbGet(`tv/${maybeId}/season/${seasonNumber}`);
    return res.json({
      id: `tmdb:tv:${maybeId}:season:${seasonNumber}`,
      seasonNumber,
      name: season.name || `Season ${seasonNumber}`,
      episodeCount: season.episodes?.length || 0,
      airDate: season.air_date || null,
      posterUrl: poster(season.poster_path),
      episodes: (season.episodes || []).map((episode) => ({
        id: `tmdb:tv:${maybeId}:season:${seasonNumber}:episode:${episode.episode_number}`,
        seasonNumber,
        episodeNumber: episode.episode_number,
        title: episode.name || null,
        airDate: episode.air_date || null,
        runtimeMinutes: episode.runtime || null,
        stillUrl: poster(episode.still_path, "w300"),
        overview: episode.overview || null,
        watched: false,
      })),
    });
  }

  const media = await resolveMediaById(req.params.id);
  if (media.kind !== "anime") {
    return res.status(404).json({ error: "Season data is not available for this title" });
  }

  const count = media.episodeCount || media.seasons?.[0]?.episodeCount || 0;
  res.json({
    id: `${req.params.id}:season:${seasonNumber}`,
    seasonNumber,
    name: media.seasons?.[0]?.name || "Season 1",
    episodeCount: count,
    airDate: media.seasons?.[0]?.airDate || null,
    posterUrl: media.posterUrl,
    episodes: Array.from({ length: count }, (_, index) => ({
      id: `${req.params.id}:season:${seasonNumber}:episode:${index + 1}`,
      seasonNumber,
      episodeNumber: index + 1,
      title: null,
      airDate: null,
      runtimeMinutes: media.durationMinutes || null,
      stillUrl: null,
      overview: null,
      watched: false,
    })),
  });
}));

app.get("/api/upcoming", asyncRoute(async (req, res) => {
  const [movies, tv, anime] = await Promise.allSettled([
    tmdbGet("movie/upcoming", { region: req.query.region || "US" }).then((data) => (data.results || []).slice(0, 8).map((item) => mapTmdbSummary(item, "movie"))),
    tmdbGet("tv/on_the_air").then((data) => (data.results || []).slice(0, 8).map((item) => mapTmdbSummary(item, "tv"))),
    anilistSearch(undefined, 1, 8),
  ]);

  const results = [movies, tv, anime]
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .filter(Boolean)
    .map((item) => ({ ...item, status: "Upcoming" }))
    .slice(0, 20);

  res.json(results);
}));

app.get("/api/brain/insights", asyncRoute(async (req, res) => {
  library = await Promise.all(library.map(hydrateLibraryItemMedia));
  res.json(buildInsights());
}));

app.get("/api/user/stats", asyncRoute(async (req, res) => {
  library = await Promise.all(library.map(hydrateLibraryItemMedia));
  res.json(buildStats());
}));

app.get("/api/user/library", asyncRoute(async (req, res) => {
  library = await Promise.all(library.map(hydrateLibraryItemMedia));
  res.json(library);
}));

app.post("/api/user/library", asyncRoute(async (req, res) => {
  const now = new Date().toISOString();

  if (!req.body.mediaId) return res.status(400).json({ error: "mediaId is required" });

  const existing = library.find((item) => item.mediaId === req.body.mediaId);
  let media = req.body.media || (existing?.media && hasDetailFields(existing.media) ? existing.media : null);

  if (media) {
    cacheMedia(media);
  } else {
    try {
      media = await resolveMediaById(req.body.mediaId);
    } catch {
      media = null;
    }
  }

  const item = {
    mediaId: req.body.mediaId,
    status: req.body.status || "plan",
    progressPercent: clampProgress(req.body.progressPercent),
    lastEpisode: req.body.lastEpisode || null,
    rating: req.body.rating ?? null,
    notes: req.body.notes ?? null,
    media,
    addedAt: existing?.addedAt || now,
    updatedAt: now,
  };

  library = library.filter((current) => current.mediaId !== item.mediaId).concat(item);
  persistLibrary();
  res.status(201).json({ success: true, data: item });
}));

app.patch("/api/user/library/:mediaId", asyncRoute(async (req, res) => {
  const index = library.findIndex((item) => item.mediaId === req.params.mediaId);
  if (index === -1) return res.status(404).json({ error: "Library item not found" });

  let media = req.body.media || library[index].media || null;
  if (media) cacheMedia(media);

  library[index] = {
    ...library[index],
    ...req.body,
    mediaId: library[index].mediaId,
    media,
    progressPercent: req.body.progressPercent === undefined ? library[index].progressPercent : clampProgress(req.body.progressPercent),
    updatedAt: new Date().toISOString(),
  };

  persistLibrary();
  res.json({ success: true, data: library[index] });
}));

app.delete("/api/user/library/:mediaId", (req, res) => {
  const before = library.length;
  library = library.filter((item) => item.mediaId !== req.params.mediaId);
  persistLibrary();
  res.json({ success: true, removed: before !== library.length });
});

if (process.env.NODE_ENV === "test") {
  app.post("/api/test/reset", (req, res) => {
    library = [];
    mediaCache.clear();
    persistLibrary();
    res.json({ success: true });
  });
}

app.get("/api/omdb", asyncRoute(async (req, res) => {
  const apikey = requireConfigValue(config.omdbApiKey, "OMDB_API_KEY");
  const response = await axios.get(config.omdbBaseUrl, {
    params: { ...normalizeQuery(req.query), apikey },
    timeout: 10000,
  });
  res.json(response.data);
}));

app.post("/api/anilist", asyncRoute(async (req, res) => {
  const response = await axios.post(config.anilistBaseUrl, req.body, {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    timeout: 15000,
  });
  res.json(response.data);
}));

app.get("/api/jikan/*", asyncRoute(async (req, res) => {
  const endpoint = buildPath(req);
  const response = await axios.get(`${config.jikanBaseUrl.replace(/\/$/, "")}/${endpoint}`, {
    params: normalizeQuery(req.query),
    timeout: 15000,
  });
  res.json(response.data);
}));

app.get("/api/watchmode/*", asyncRoute(async (req, res) => {
  const apiKey = requireConfigValue(config.watchmodeApiKey, "WATCHMODE_API_KEY");
  const endpoint = buildPath(req);
  const response = await axios.get(`${config.watchmodeBaseUrl.replace(/\/$/, "")}/${endpoint}`, {
    params: { ...normalizeQuery(req.query), apiKey },
    timeout: 15000,
  });
  res.json(response.data);
}));

app.get("/api/tmdb/*", asyncRoute(async (req, res) => {
  const endpoint = buildPath(req);
  const headers = {};
  const params = normalizeQuery(req.query);

  if (config.tmdbReadAccessToken) {
    headers.Authorization = `Bearer ${config.tmdbReadAccessToken}`;
  } else {
    params.api_key = requireConfigValue(config.tmdbApiKey, "TMDB_API_KEY");
  }

  const response = await axios.get(`${config.tmdbBaseUrl.replace(/\/$/, "")}/${endpoint}`, {
    headers,
    params,
    timeout: 15000,
  });
  res.json(response.data);
}));

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  if (error.response) {
    const { status, body } = externalError(error, "External API");
    return res.status(status).json(body);
  }

  const status = error.status || 500;
  res.status(status).json({ error: error.message || "Something went wrong" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`WatchVault backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
