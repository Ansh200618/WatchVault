import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  ApiStatusItem,
  LibraryStatus,
  Media,
  MediaItem,
  UserLibraryItem,
  WatchStatsItem,
} from "../data";
import { API_BASE_URL, apiService, apiStatusToCards, mediaItemToMedia } from "./api";

type Insight = {
  icon?: string;
  text: string;
  action: string;
  mediaId?: string;
};

type MediaBuckets = {
  all: Media[];
  movies: Media[];
  series: Media[];
  anime: Media[];
};

type LiveDataState = {
  media: Media[];
  mediaBuckets: MediaBuckets;
  upcoming: Media[];
  insights: Insight[];
  apiStatus: ApiStatusItem[];
  stats: WatchStatsItem;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  searchMedia: (query: string, kind?: "movie" | "tv" | "anime") => Promise<Media[]>;
};

const emptyBuckets: MediaBuckets = {
  all: [],
  movies: [],
  series: [],
  anime: [],
};

const emptyStats: WatchStatsItem = {
  moviesWatched: 0,
  episodesWatched: 0,
  animeCompleted: 0,
  watchHours: 0,
  pendingTitles: 0,
  completionRatePercent: 0,
  favoriteGenre: null,
  favoriteLanguage: null,
  monthlyHours: [],
  genreDistribution: [],
};

const LiveDataContext = createContext<LiveDataState | null>(null);

function statusLabel(status: LibraryStatus | undefined): Media["status"] {
  const map: Record<LibraryStatus, Media["status"]> = {
    watching: "Watching",
    plan: "Plan",
    completed: "Completed",
    dropped: "Dropped",
    on_hold: "On Hold",
    favorite: "Favorite",
  };
  return status ? map[status] : undefined;
}

function withLibrary(media: Media[], library: UserLibraryItem[]) {
  const byId = new Map(library.map((item) => [item.mediaId, item]));

  return media.map((item) => {
    const tracked = byId.get(item.id);
    if (!tracked) return item;

    return {
      ...item,
      status: statusLabel(tracked.status),
      progress: tracked.progressPercent,
      lastEpisode: tracked.lastEpisode ? `S${tracked.lastEpisode.season} E${tracked.lastEpisode.episode}` : item.lastEpisode,
    };
  });
}

function uniqueById(items: Media[]) {
  return Array.from(new Map(items.filter((item) => item.id).map((item) => [item.id, item])).values());
}

function mediaFromLibraryItem(item: UserLibraryItem): Media | null {
  if (!item.media) return null;
  return {
    ...mediaItemToMedia(item.media as MediaItem),
    status: statusLabel(item.status),
    progress: item.progressPercent,
    lastEpisode: item.lastEpisode ? `S${item.lastEpisode.season} E${item.lastEpisode.episode}` : undefined,
  };
}

async function readJson<T>(path: string): Promise<T> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${cleanPath}`, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Failed to fetch ${cleanPath}`);
  return response.json();
}

function buildBuckets(items: Media[]): MediaBuckets {
  const all = uniqueById(items);
  return {
    all,
    movies: all.filter((item) => item.type === "Movie"),
    series: all.filter((item) => item.type === "Series"),
    anime: all.filter((item) => item.type === "Anime"),
  };
}

function normalizeSeriesTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(season|series|part|cour)\s*\d+\b/gi, " ")
    .replace(/\b\d+(st|nd|rd|th)?\s+season\b/gi, " ")
    .replace(/\b(s\d+|season\s*[ivx]+)\b/gi, " ")
    .replace(/\b(final|new)\s+season\b/gi, " ")
    .replace(/\b(tv|ova|ona|specials?|movie)\b/gi, " ")
    .replace(/[’'":._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchGroupKey(item: Media) {
  if (item.type === "Movie") return `movie:${item.id}`;
  return `${item.type}:${normalizeSeriesTitle(item.parentTitle || item.title) || item.id}`;
}

function seasonDetailsFor(item: Media) {
  if (item.seasonDetails?.length) return item.seasonDetails;
  if (item.type === "Series" || item.type === "Anime") {
    return [{
      id: `${item.id}:group-season:${item.seasonNumber || item.seasons || 1}`,
      seasonNumber: item.seasonNumber || item.seasons || 1,
      name: item.seasonNumber ? `Season ${item.seasonNumber}` : item.title,
      episodeCount: item.totalEpisodes || 0,
      airDate: item.releaseDate || null,
      posterUrl: item.poster || null,
      watchedCount: item.watched || 0,
    }];
  }
  return [];
}

function mergeSeasonDetails(a: Media["seasonDetails"] = [], b: Media["seasonDetails"] = []) {
  const bySeason = new Map<number, NonNullable<Media["seasonDetails"]>[number]>();
  [...a, ...b].forEach((season) => {
    if (!season) return;
    const key = season.seasonNumber || bySeason.size + 1;
    const existing = bySeason.get(key);
    bySeason.set(key, {
      ...existing,
      ...season,
      episodeCount: Math.max(existing?.episodeCount || 0, season.episodeCount || 0),
      watchedCount: Math.max(existing?.watchedCount || 0, season.watchedCount || 0),
    });
  });
  return Array.from(bySeason.values()).sort((x, y) => (x.seasonNumber || 0) - (y.seasonNumber || 0));
}

function isBetterMainResult(candidate: Media, current: Media) {
  const candidateIsEpisode = candidate.releaseType === "episode" || candidate.releaseType === "anime_episode";
  const currentIsEpisode = current.releaseType === "episode" || current.releaseType === "anime_episode";
  const candidateSeasonCount = candidate.seasonDetails?.length || candidate.seasons || 0;
  const currentSeasonCount = current.seasonDetails?.length || current.seasons || 0;

  if (currentIsEpisode && !candidateIsEpisode) return true;
  if (candidateSeasonCount > currentSeasonCount) return true;
  if ((candidate.totalEpisodes || 0) > (current.totalEpisodes || 0)) return true;
  if (!current.poster && candidate.poster) return true;
  return false;
}

function mergeSearchGroup(current: Media, candidate: Media): Media {
  const base = isBetterMainResult(candidate, current) ? candidate : current;
  const other = base === current ? candidate : current;
  const seasonDetails = mergeSeasonDetails(seasonDetailsFor(base), seasonDetailsFor(other));
  const seasonCount = Math.max(base.seasons || 0, other.seasons || 0, seasonDetails.length);
  const totalEpisodes = Math.max(
    base.totalEpisodes || 0,
    other.totalEpisodes || 0,
    seasonDetails.reduce((sum, season) => sum + (season.episodeCount || 0), 0),
  );

  return {
    ...base,
    title: base.parentTitle || base.title,
    parentTitle: base.parentTitle || other.parentTitle || base.title,
    seasonDetails,
    seasons: seasonCount || undefined,
    totalEpisodes: totalEpisodes || undefined,
    releaseType: base.type === "Movie" ? base.releaseType : "season",
    seasonNumber: undefined,
    episodeNumber: undefined,
    episodeTitle: undefined,
    overview: base.overview || other.overview,
    poster: base.poster || other.poster,
    banner: base.banner || other.banner,
    genres: Array.from(new Set([...(base.genres || []), ...(other.genres || [])])),
    audioLanguages: Array.from(new Set([...(base.audioLanguages || []), ...(other.audioLanguages || [])])),
    providers: Array.from(new Set([...(base.providers || []), ...(other.providers || [])])),
  };
}

function groupSearchResults(items: Media[]) {
  const grouped = new Map<string, Media>();
  items.forEach((item) => {
    const key = searchGroupKey(item);
    const existing = grouped.get(key);
    grouped.set(key, existing ? mergeSearchGroup(existing, item) : item);
  });
  return Array.from(grouped.values());
}

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const [media, setMedia] = useState<Media[]>([]);
  const [mediaBuckets, setMediaBuckets] = useState<MediaBuckets>(emptyBuckets);
  const [upcoming, setUpcoming] = useState<Media[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatusItem[]>([]);
  const [stats, setStats] = useState<WatchStatsItem>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [moviesResult, seriesResult, animeResult, libraryResult, upcomingResult, statusResult, statsResult, insightsResult] = await Promise.allSettled([
        apiService.getPopularMedia("movie"),
        apiService.getPopularMedia("tv"),
        apiService.getPopularMedia("anime"),
        apiService.getUserLibrary(),
        readJson<MediaItem[]>("/upcoming"),
        readJson<{ apis: Record<string, string> }>("/status"),
        apiService.getStats(),
        readJson<Insight[]>("/brain/insights"),
      ]);

      const movies = moviesResult.status === "fulfilled" ? moviesResult.value.map(mediaItemToMedia) : [];
      const series = seriesResult.status === "fulfilled" ? seriesResult.value.map(mediaItemToMedia) : [];
      const anime = animeResult.status === "fulfilled" ? animeResult.value.map(mediaItemToMedia) : [];
      const popular = uniqueById([...movies, ...series, ...anime]);
      const library = libraryResult.status === "fulfilled" ? libraryResult.value : [];
      const libraryMedia = library.map(mediaFromLibraryItem).filter((item): item is Media => Boolean(item));
      const upcomingMedia =
        upcomingResult.status === "fulfilled"
          ? upcomingResult.value.map((item) => ({ ...mediaItemToMedia(item), status: "Upcoming" as const }))
          : [];
      const merged = uniqueById(withLibrary([...libraryMedia, ...popular, ...upcomingMedia], library));
      const buckets = buildBuckets(merged);

      setUpcoming(upcomingMedia);
      setMedia(buckets.all);
      setMediaBuckets(buckets);
      setApiStatus(statusResult.status === "fulfilled" ? apiStatusToCards(statusResult.value.apis || {}) : []);
      setStats(statsResult.status === "fulfilled" ? statsResult.value : emptyStats);
      setInsights(insightsResult.status === "fulfilled" ? insightsResult.value : []);

      if (!merged.length && !upcomingMedia.length) {
        setError("No live API data returned. Check backend URL and API keys in Settings.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load live backend data");
      setMedia([]);
      setMediaBuckets(emptyBuckets);
      setUpcoming([]);
      setInsights([]);
      setApiStatus([]);
      setStats(emptyStats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onOnline = () => void refresh();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [refresh]);

  const searchMedia = useCallback(async (query: string, kind?: "movie" | "tv" | "anime") => {
    if (!query.trim()) return media;
    try {
      const results = await apiService.searchMedia(query, kind);
      return groupSearchResults(results.map(mediaItemToMedia));
    } catch {
      return [];
    }
  }, [media]);

  const value = useMemo(
    () => ({ media, mediaBuckets, upcoming, insights, apiStatus, stats, loading, error, refresh, searchMedia }),
    [apiStatus, error, insights, loading, media, mediaBuckets, refresh, searchMedia, stats, upcoming]
  );

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}

export function useLiveData() {
  const context = useContext(LiveDataContext);

  if (!context) {
    throw new Error("useLiveData must be used inside LiveDataProvider");
  }

  return context;
}