const fs = require("fs");
const path = require("path");

const app = require("./server");

const shouldPersistLibrary = process.env.NODE_ENV !== "test";
const dataDir = path.join(__dirname, "data");
const librariesFile = path.join(dataDir, "libraries.json");
const devicesFile = path.join(dataDir, "devices.json");
const profilesFile = path.join(dataDir, "profiles.json");
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

function cleanUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 24);
}

function usernameValidationError(username) {
  if (!username || username.length < 3) return "Username must be at least 3 characters.";
  if (username.length > 24) return "Username must be 24 characters or less.";
  if (!/^[a-z0-9_.]+$/.test(username)) return "Username can only use letters, numbers, underscore, and dot.";
  if (/^[._]|[._]$/.test(username)) return "Username cannot start or end with dot or underscore.";
  return null;
}

function getUserDevices(userId, devices = readJsonObject(devicesFile, {})) {
  return Array.isArray(devices[userId]) ? devices[userId] : [];
}

function safeDevice(device, currentDeviceId) {
  const id = String(device.deviceId || "");
  return {
    id: id ? `${id.slice(0, 8)}…${id.slice(-4)}` : "Unknown device",
    current: id === currentDeviceId,
    firstSeenAt: device.firstSeenAt || null,
    lastSeenAt: device.lastSeenAt || null,
  };
}

function registerDeviceForUser(userId, req, res) {
  const cleanedUserId = cleanUserId(userId);
  const deviceId = deviceIdFromRequest(req);
  if (cleanedUserId === "anonymous" || deviceId === "dev_unknown") return true;

  const devices = readJsonObject(devicesFile, {});
  const userDevices = getUserDevices(cleanedUserId, devices);
  const now = new Date().toISOString();
  const existing = userDevices.find((device) => device.deviceId === deviceId);

  if (existing) {
    existing.lastSeenAt = now;
    devices[cleanedUserId] = userDevices;
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
  devices[cleanedUserId] = userDevices;
  writeJsonObject(devicesFile, devices);
  return true;
}

function registerDevice(req, res) {
  return registerDeviceForUser(userIdFromRequest(req), req, res);
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
  const linkedDevices = getUserDevices(userId, devices).length;
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
  const requestedUserId = cleanUserId(req.body?.userId);
  if (!registerDeviceForUser(requestedUserId, req, res)) return;
  const libraries = getLibraries();
  const library = Array.isArray(libraries[requestedUserId]) ? libraries[requestedUserId] : [];
  res.json({ success: true, userId: requestedUserId, found: library.length > 0, itemCount: library.length, library });
});

app.get("/api/user/devices", (req, res) => {
  if (!registerDevice(req, res)) return;
  const userId = userIdFromRequest(req);
  const currentDeviceId = deviceIdFromRequest(req);
  const devices = getUserDevices(userId).map((device) => safeDevice(device, currentDeviceId));
  res.json({ userId, linkedDevices: devices.length, maxDevices: MAX_DEVICES_PER_USER, devices });
});

app.get("/api/user/profile", (req, res) => {
  if (!registerDevice(req, res)) return;
  const userId = userIdFromRequest(req);
  const profiles = readJsonObject(profilesFile, {});
  res.json({ userId, username: profiles[userId]?.username || null, updatedAt: profiles[userId]?.updatedAt || null });
});

app.patch("/api/user/profile", (req, res) => {
  if (!registerDevice(req, res)) return;
  const userId = userIdFromRequest(req);
  const username = cleanUsername(req.body?.username);
  const validationError = usernameValidationError(username);
  if (validationError) return res.status(400).json({ error: validationError });

  const profiles = readJsonObject(profilesFile, {});
  const takenBy = Object.entries(profiles).find(([otherUserId, profile]) => otherUserId !== userId && profile?.username === username);
  if (takenBy) return res.status(409).json({ error: "Username is already taken." });

  const now = new Date().toISOString();
  profiles[userId] = {
    username,
    createdAt: profiles[userId]?.createdAt || now,
    updatedAt: now,
  };
  writeJsonObject(profilesFile, profiles);
  res.json({ success: true, userId, username, updatedAt: now });
});

app.delete("/api/user/account", (req, res) => {
  const userId = userIdFromRequest(req);
  const libraries = readJsonObject(librariesFile, {});
  const devices = readJsonObject(devicesFile, {});
  const profiles = readJsonObject(profilesFile, {});
  delete libraries[userId];
  delete devices[userId];
  delete profiles[userId];
  writeJsonObject(librariesFile, libraries);
  writeJsonObject(devicesFile, devices);
  writeJsonObject(profilesFile, profiles);
  res.json({ success: true, deletedUserId: userId });
});

if (process.env.NODE_ENV === "test") {
  app.post("/api/test/reset", (req, res) => {
    saveLibraries({});
    writeJsonObject(devicesFile, {});
    writeJsonObject(profilesFile, {});
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
