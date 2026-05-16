const axios = require("axios");
const express = require("express");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = require("./server");

const PORT = Number(process.env.PORT || 5000);
const shouldPersistLibrary = process.env.NODE_ENV !== "test";
const dataDir = path.join(__dirname, "data");
const librariesFile = path.join(dataDir, "libraries.json");
const mediaCache = new Map();
let libraries = readStoredLibraries();

function cleanUserId(value) {
  return String(value || "anonymous")
    .trim()
    .replace(/[^a-zA-Z0-9:_-]/g, "")
    .slice(0, 80) || "anonymous";
}

function userIdFromRequest(req) {
  return cleanUserId(req.get("X-WatchVault-User") || req.query.userId || "anonymous");
}

function readStoredLibraries() {
  if (!shouldPersistLibrary) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(librariesFile, "utf8"));
    if (Array.isArray(parsed)) return { anonymous: compactLibrary(parsed) };
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(Object.entries(parsed).map(([userId, items]) => [cleanUserId(userId), compactLibrary(items)]));
  } catch {
    return {};
  }
}

function persistLibraries() {
  if (!shouldPersistLibrary) return;
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(librariesFile, JSON.stringify(libraries, null, 2));
}

function clampProgress(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function compactWatchedEpisodes(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw)
      .filter(([key, value]) => Boolean(value) && /^\d+-\d+$/.test(String(key)))
      .slice(0, 2000)
  );
}

function compactLibraryItem(raw = {}, existing = {}) {
  const mediaId = String(raw.mediaId || existing.mediaId || "");
  return {
    mediaId,
    status: raw.status || existing.status || "plan",
    progressPercent: raw.progressPercent === undefined ? clampProgress(existing.progressPercent) : clampProgress(raw.progressPercent),
    lastEpisode: normalizeLastEpisode(raw.lastEpisode === undefined ? existing.lastEpisode : raw.lastEpisode),
    watchedEpisodes: compactWatchedEpisodes(raw.watchedEpisodes || existing.watchedEpisodes),
    rating: raw.rating === undefined ? existing.rating ?? null : raw.rating,
    notes: raw.notes === undefined ? existing.notes ?? null : String(raw.notes || "").slice(0, 1000),
    addedAt: existing.addedAt || raw.addedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeLastEpisode(value) {
  if (value === null) return null;
  if (!value || typeof value !== "object") return null;
  const season = Number(value.season);
  const episode = Number(value.episode);
  if (!Number.isFinite(season) || !Number.isFinite(episode)) return null;
  return { season, episode };
}

function compactLibrary(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => compactLibraryItem(item))
    .filter((item) => item.mediaId)
    .slice(0, 500);
}

function getUserLibrary(req) {
  const userId = userIdFromRequest(req);
  if (!libraries[userId]) libraries[userId] = [];
  return libraries[userId];
}

function setUserLibrary(req, nextLibrary) {
  const userId = userIdFromRequest(req);
  libraries[userId] = compactLibrary(nextLibrary);
  persistLibraries();
  return libraries[userId];
}

async function resolveMedia(mediaId) {
  if (!mediaId) return null;
  if (mediaCache.has(mediaId)) return mediaCache.get(mediaId);
  try {
    const response = await axios.get(`http://127.0.0.1:${PORT}/api/media/${encodeURIComponent(mediaId)}`, { timeout: 15000 });
    mediaCache.set(mediaId, response.data);
    return response.data;
  } catch {
    return null;
  }
}

async function hydrateItem(item) {
  const media = await resolveMedia(item.mediaId);
  return { ...item, media };
}

async function hydrateLibrary(items) {
  return Promise.all(items.map(hydrateItem));
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

function watchedCountFor(item, media) {
  const exact = Object.values(item.watchedEpisodes || {}).filter(Boolean).length;
  if (exact) return exact;
  if (item.lastEpisode?.episode) return item.lastEpisode.episode;
  return Math.floor(totalEpisodesFor(media) * (clampProgress(item.progressPercent) / 100));
}

function buildStats(library) {
  const tracked = library.filter((item) => item.media);
  const completedItems = tracked.filter((item) => item.status === "completed" || clampProgress(item.progressPercent) >= 100);
  const genreCounts = new Map();
  const languageCounts = new Map();
  const monthlyHours = new Map();
  let moviesWatched = 0;
  let episodesWatched = 0;
  let animeCompleted = 0;
  let watchMinutes = 0;

  for (const item of tracked) {
    const media = item.media;
    const progress = item.status === "completed" ? 100 : clampProgress(item.progressPercent);
    const runtime = runtimeMinutesFor(media);
    const date = new Date(item.updatedAt || item.addedAt || Date.now());
    const month = date.toLocaleString("en-US", { month: "short" });
    let itemMinutes = 0;

    if (media.kind === "movie") {
      if (progress >= 100) moviesWatched += 1;
      itemMinutes = runtime * (progress / 100);
    } else {
      const watchedEpisodes = watchedCountFor(item, media);
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

  const genreEntries = [...genreCounts.entries()].sort((a, b) => b[1] - a[1]);
  const languageEntries = [...languageCounts.entries()].sort((a, b) => b[1] - a[1]);
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

function buildInsights(library) {
  const stats = buildStats(library);
  const insights = [];
  const watching = library.find((item) => item.status === "watching" && clampProgress(item.progressPercent) > 0 && clampProgress(item.progressPercent) < 100);
  const planned = library.find((item) => item.status === "plan");

  if (watching) {
    insights.push({
      icon: "NEXT",
      text: watching.media ? `Continue ${watching.media.title} from ${clampProgress(watching.progressPercent)}%` : `Continue a title from ${clampProgress(watching.progressPercent)}%`,
      action: "Open Tracker",
      mediaId: watching.mediaId,
    });
  }

  if (planned) {
    insights.push({
      icon: "PLAN",
      text: planned.media ? `${planned.media.title} is waiting in your plan list` : "A title is waiting in your plan list",
      action: "View Plan",
      mediaId: planned.mediaId,
    });
  }

  if (stats.favoriteGenre) {
    insights.push({ icon: "TASTE", text: `${stats.favoriteGenre} is your strongest watched genre`, action: "Discover" });
  }

  return insights;
}

function removeOriginalUserRoutes() {
  const blockedPaths = new Set(["/api/user/library", "/api/user/library/:mediaId", "/api/user/stats", "/api/brain/insights"]);
  if (!app._router?.stack) return;
  app._router.stack = app._router.stack.filter((layer) => !layer.route || !blockedPaths.has(layer.route.path));
}

function mountBeforeFallback(router) {
  if (!app._router?.stack) return app.use(router);
  const insertAt = Math.max(0, app._router.stack.length - 2);
  app._router.stack.splice(insertAt, 0, ...router.stack);
}

removeOriginalUserRoutes();

const router = express.Router();

router.get("/api/user/library", async (req, res, next) => {
  try {
    res.json(await hydrateLibrary(getUserLibrary(req)));
  } catch (error) {
    next(error);
  }
});

router.post("/api/user/library", async (req, res, next) => {
  try {
    if (!req.body.mediaId) return res.status(400).json({ error: "mediaId is required" });
    const current = getUserLibrary(req);
    const existing = current.find((item) => item.mediaId === req.body.mediaId) || {};
    const item = compactLibraryItem(req.body, existing);
    setUserLibrary(req, current.filter((entry) => entry.mediaId !== item.mediaId).concat(item));
    res.status(201).json({ success: true, data: await hydrateItem(item) });
  } catch (error) {
    next(error);
  }
});

router.patch("/api/user/library/:mediaId", async (req, res, next) => {
  try {
    const current = getUserLibrary(req);
    const index = current.findIndex((item) => item.mediaId === req.params.mediaId);
    if (index === -1) return res.status(404).json({ error: "Library item not found" });
    const nextItem = compactLibraryItem({ ...req.body, mediaId: current[index].mediaId }, current[index]);
    const updated = current.slice();
    updated[index] = nextItem;
    setUserLibrary(req, updated);
    res.json({ success: true, data: await hydrateItem(nextItem) });
  } catch (error) {
    next(error);
  }
});

router.delete("/api/user/library/:mediaId", (req, res, next) => {
  try {
    const current = getUserLibrary(req);
    const updated = current.filter((item) => item.mediaId !== req.params.mediaId);
    setUserLibrary(req, updated);
    res.json({ success: true, removed: current.length !== updated.length });
  } catch (error) {
    next(error);
  }
});

router.get("/api/user/stats", async (req, res, next) => {
  try {
    res.json(buildStats(await hydrateLibrary(getUserLibrary(req))));
  } catch (error) {
    next(error);
  }
});

router.get("/api/brain/insights", async (req, res, next) => {
  try {
    res.json(buildInsights(await hydrateLibrary(getUserLibrary(req))));
  } catch (error) {
    next(error);
  }
});

if (process.env.NODE_ENV === "test") {
  router.post("/api/test/reset", (req, res) => {
    libraries = {};
    mediaCache.clear();
    persistLibraries();
    res.json({ success: true });
  });
}

mountBeforeFallback(router);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`WatchVault backend running with per-user storage on http://localhost:${PORT}`);
  });
}

module.exports = app;
