const fs = require("fs");
const path = require("path");

const app = require("./server");

const shouldPersistLibrary = process.env.NODE_ENV !== "test";
const dataDir = path.join(__dirname, "data");
const librariesFile = path.join(dataDir, "libraries.json");
const devicesFile = path.join(dataDir, "devices.json");
const PORT = Number(process.env.PORT || 5000);
const MAX_DEVICES_PER_USER = 5;

function cleanUserId(value) {
  return String(value || "anonymous")
    .trim()
    .replace(/[^a-zA-Z0-9:_-]/g, "")
    .slice(0, 80) || "anonymous";
}

function userIdFromRequest(req) {
  return cleanUserId(req.get("X-WatchVault-User") || req.query.userId || "anonymous");
}

function deviceIdFromRequest(req) {
  return cleanUserId(req.get("X-WatchVault-Device") || req.query.deviceId || "dev_unknown");
}

function readJsonObject(file, fallback = {}) {
  if (!shouldPersistLibrary) return fallback;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonObject(file, value) {
  if (!shouldPersistLibrary) return;
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2));
}

function registerDevice(req, res) {
  const userId = userIdFromRequest(req);
  const deviceId = deviceIdFromRequest(req);
  if (userId === "anonymous" || deviceId === "dev_unknown") return true;

  const devices = readJsonObject(devicesFile, {});
  const userDevices = Array.isArray(devices[userId]) ? devices[userId] : [];
  const now = new Date().toISOString();
  const existing = userDevices.find((device) => device.deviceId === deviceId);

  if (existing) {
    existing.lastSeenAt = now;
    writeJsonObject(devicesFile, devices);
    return true;
  }

  if (userDevices.length >= MAX_DEVICES_PER_USER) {
    res.status(403).json({
      error: "Device limit reached",
      message: "This WatchVault account is already linked to 5 devices. Remove another device or use a different User ID.",
      maxDevices: MAX_DEVICES_PER_USER,
      linkedDevices: userDevices.length,
    });
    return false;
  }

  userDevices.push({ deviceId, firstSeenAt: now, lastSeenAt: now });
  devices[userId] = userDevices;
  writeJsonObject(devicesFile, devices);
  return true;
}

function compactWatchedEpisodes(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw)
      .filter(([key, value]) => Boolean(value) && /^\d+-\d+$/.test(String(key)))
      .slice(0, 2000)
  );
}

function clampProgress(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function compactItem(raw = {}, existing = {}) {
  return {
    mediaId: String(raw.mediaId || existing.mediaId || ""),
    status: raw.status || existing.status || "plan",
    progressPercent: clampProgress(raw.progressPercent === undefined ? existing.progressPercent : raw.progressPercent),
    lastEpisode: raw.lastEpisode === null
      ? null
      : raw.lastEpisode && Number.isFinite(Number(raw.lastEpisode.season)) && Number.isFinite(Number(raw.lastEpisode.episode))
        ? { season: Number(raw.lastEpisode.season), episode: Number(raw.lastEpisode.episode) }
        : existing.lastEpisode || null,
    watchedEpisodes: compactWatchedEpisodes(raw.watchedEpisodes || existing.watchedEpisodes),
    rating: raw.rating === undefined ? existing.rating ?? null : raw.rating,
    notes: raw.notes === undefined ? existing.notes ?? null : String(raw.notes || "").slice(0, 1000),
    addedAt: existing.addedAt || raw.addedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function readLibraries() {
  return readJsonObject(librariesFile, {});
}

function saveLibraries(libraries) {
  writeJsonObject(librariesFile, libraries);
}

function getLibraries() {
  return readLibraries();
}

function getUserLibrary(req) {
  const libraries = getLibraries();
  const userId = userIdFromRequest(req);
  return { libraries, userId, library: Array.isArray(libraries[userId]) ? libraries[userId] : [] };
}

function setUserLibraryById(userId, nextLibrary) {
  const libraries = getLibraries();
  libraries[userId] = nextLibrary.map((item) => compactItem(item)).filter((item) => item.mediaId).slice(0, 500);
  saveLibraries(libraries);
  return libraries[userId];
}

function setUserLibrary(req, nextLibrary) {
  return setUserLibraryById(userIdFromRequest(req), nextLibrary);
}

function removeOriginalUserRoutesAndTerminalHandlers() {
  const userPaths = new Set([
    "/api/user/library",
    "/api/user/library/:mediaId",
    "/api/user/stats",
    "/api/brain/insights",
    "/api/test/reset",
  ]);

  if (!app._router || !Array.isArray(app._router.stack)) return;

  app._router.stack = app._router.stack.filter((layer) => {
    const routePath = layer.route && layer.route.path;
    if (userPaths.has(routePath)) return false;

    const isTerminalMiddleware = !layer.route && typeof layer.handle === "function" && (layer.handle.length === 2 || layer.handle.length === 4);
    if (isTerminalMiddleware) return false;

    return true;
  });
}

function countWatchedEpisodes(item) {
  const exact = Object.values(item.watchedEpisodes || {}).filter(Boolean).length;
  if (exact) return exact;
  return item.lastEpisode?.episode ? Number(item.lastEpisode.episode) || 0 : 0;
}

function buildStats(library) {
  const completed = library.filter((item) => item.status === "completed" || clampProgress(item.progressPercent) >= 100).length;
  const episodesWatched = library.reduce((sum, item) => sum + countWatchedEpisodes(item), 0);

  return {
    moviesWatched: completed,
    episodesWatched,
    animeCompleted: 0,
    watchHours: 0,
    pendingTitles: library.filter((item) => item.status === "plan").length,
    completionRatePercent: library.length ? Math.round((completed / library.length) * 100) : 0,
    favoriteGenre: null,
    favoriteLanguage: null,
    monthlyHours: [],
    genreDistribution: [],
  };
}

function buildInsights(library) {
  const insights = [];
  const watching = library.find((item) => item.status === "watching" && clampProgress(item.progressPercent) > 0 && clampProgress(item.progressPercent) < 100);
  const planned = library.find((item) => item.status === "plan");

  if (watching) {
    insights.push({
      icon: "NEXT",
      text: `Continue from ${clampProgress(watching.progressPercent)}%`,
      action: "Open Tracker",
      mediaId: watching.mediaId,
    });
  }

  if (planned) {
    insights.push({
      icon: "PLAN",
      text: "A title is waiting in your plan list",
      action: "View Plan",
      mediaId: planned.mediaId,
    });
  }

  return insights;
}

removeOriginalUserRoutesAndTerminalHandlers();

app.get("/api/user/library", (req, res) => {
  if (!registerDevice(req, res)) return;
  const { library } = getUserLibrary(req);
  res.json(library);
});

app.post("/api/user/library", (req, res) => {
  if (!registerDevice(req, res)) return;
  if (!req.body.mediaId) return res.status(400).json({ error: "mediaId is required" });
  const { library } = getUserLibrary(req);
  const existing = library.find((item) => item.mediaId === req.body.mediaId) || {};
  const item = compactItem(req.body, existing);
  const next = library.filter((entry) => entry.mediaId !== item.mediaId).concat(item);
  setUserLibrary(req, next);
  res.status(existing.mediaId ? 200 : 201).json({ success: true, data: item });
});

app.patch("/api/user/library/:mediaId", (req, res) => {
  if (!registerDevice(req, res)) return;
  const { library } = getUserLibrary(req);
  const existing = library.find((item) => item.mediaId === req.params.mediaId) || { mediaId: req.params.mediaId };
  const item = compactItem({ ...req.body, mediaId: req.params.mediaId }, existing);
  const next = library.filter((entry) => entry.mediaId !== item.mediaId).concat(item);
  setUserLibrary(req, next);
  res.json({ success: true, data: item });
});

app.delete("/api/user/library/:mediaId", (req, res) => {
  if (!registerDevice(req, res)) return;
  const { library } = getUserLibrary(req);
  const next = library.filter((item) => item.mediaId !== req.params.mediaId);
  setUserLibrary(req, next);
  res.json({ success: true, removed: next.length !== library.length });
});

app.get("/api/user/stats", (req, res) => {
  if (!registerDevice(req, res)) return;
  const { library } = getUserLibrary(req);
  res.json(buildStats(library));
});

app.get("/api/brain/insights", (req, res) => {
  if (!registerDevice(req, res)) return;
  const { library } = getUserLibrary(req);
  res.json(buildInsights(library));
});

app.get("/api/user/export", (req, res) => {
  if (!registerDevice(req, res)) return;
  const { userId, library } = getUserLibrary(req);
  const devices = readJsonObject(devicesFile, {});
  const linkedDevices = Array.isArray(devices[userId]) ? devices[userId].length : 0;
  res.json({
    app: "WatchVault",
    version: 1,
    exportedAt: new Date().toISOString(),
    userId,
    linkedDevices,
    maxDevices: MAX_DEVICES_PER_USER,
    library,
  });
});

app.post("/api/user/import", (req, res) => {
  if (!registerDevice(req, res)) return;
  const targetUserId = userIdFromRequest(req);
  const items = Array.isArray(req.body?.library) ? req.body.library : [];
  const nextLibrary = items.map((item) => compactItem(item)).filter((item) => item.mediaId).slice(0, 500);
  const saved = setUserLibraryById(targetUserId, nextLibrary);
  res.json({ success: true, imported: saved.length, userId: targetUserId });
});

app.post("/api/user/recover", (req, res) => {
  if (!registerDevice(req, res)) return;
  const requestedUserId = cleanUserId(req.body?.userId);
  const libraries = getLibraries();
  const library = Array.isArray(libraries[requestedUserId]) ? libraries[requestedUserId] : [];
  res.json({ success: true, userId: requestedUserId, found: library.length > 0, itemCount: library.length, library });
});

if (process.env.NODE_ENV === "test") {
  app.post("/api/test/reset", (req, res) => {
    saveLibraries({});
    writeJsonObject(devicesFile, {});
    res.json({ success: true });
  });
}

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  if (error.response) {
    return res.status(error.response.status || 502).json({ error: error.message || "External API error" });
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
