export type AppUpdateInfo = {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  apkUrl: string | null;
  releaseUrl: string | null;
  notes: string | null;
  publishedAt: string | null;
};

const OWNER = "Ansh200618";
const REPO = "WatchVault";
const FALLBACK_VERSION = "1.0.0";

export const CURRENT_APP_VERSION = String(import.meta.env.VITE_APP_VERSION || FALLBACK_VERSION);

function versionParts(version: string) {
  return version
    .replace(/^v/i, "")
    .split(/[.-]/)
    .map((part) => Number(part.replace(/\D/g, "")) || 0);
}

export function isNewerVersion(latest: string, current: string) {
  const a = versionParts(latest);
  const b = versionParts(current);
  const length = Math.max(a.length, b.length, 3);

  for (let i = 0; i < length; i += 1) {
    const left = a[i] || 0;
    const right = b[i] || 0;
    if (left > right) return true;
    if (left < right) return false;
  }

  return false;
}

export async function checkForAppUpdate(): Promise<AppUpdateInfo> {
  const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not check for updates right now.");
  }

  const release = await response.json();
  const latestVersion = String(release.tag_name || release.name || "").replace(/^v/i, "") || null;
  const apkAsset = Array.isArray(release.assets)
    ? release.assets.find((asset: any) => String(asset.name || "").toLowerCase().endsWith(".apk"))
    : null;

  return {
    currentVersion: CURRENT_APP_VERSION,
    latestVersion,
    updateAvailable: Boolean(latestVersion && isNewerVersion(latestVersion, CURRENT_APP_VERSION) && apkAsset?.browser_download_url),
    apkUrl: apkAsset?.browser_download_url || null,
    releaseUrl: release.html_url || null,
    notes: release.body || null,
    publishedAt: release.published_at || null,
  };
}

export function openUpdateUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
