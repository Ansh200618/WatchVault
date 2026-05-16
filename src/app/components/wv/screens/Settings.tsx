import { ArrowLeft, ChevronRight, CheckCircle2, Download, Upload, Trash2, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";
import { API_BASE_URL } from "../../../services/api";
import { useLiveData } from "../../../services/liveData";
import { reminderPermissionLabel, requestReminderPermission } from "../../../services/notifications";
import { CONTENT_TYPES, LANGUAGES, REGIONS, usePrefs } from "../prefs";

type SettingsPage = "main" | "profile" | "region" | "languages" | "content" | "api" | "data" | "about";

export function SettingsScreen({
  onBack,
  theme,
  setTheme,
}: {
  onBack: () => void;
  theme: "light" | "dark" | "amoled";
  setTheme: (t: "light" | "dark" | "amoled") => void;
}) {
  const { apiStatus, refresh, stats } = useLiveData();
  const { prefs, update, reset } = usePrefs();
  const [page, setPage] = useState<SettingsPage>("main");
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 3000);
  };

  const toggleReminders = async () => {
    if (prefs.remindersEnabled) {
      update({ remindersEnabled: false });
      showMessage("Release reminders are turned off. You can turn them on anytime here.");
      return;
    }

    const result = await requestReminderPermission();
    update({ remindersEnabled: result.enabled });
    showMessage(result.message);
  };

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: "WatchVault",
      prefs,
      stats,
      apiStatus,
      backend: API_BASE_URL,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `watchvault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showMessage("Backup exported successfully.");
  };

  const importData = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        if (parsed.prefs) update(parsed.prefs);
        showMessage("Backup imported successfully.");
      } catch {
        showMessage("Import failed. Select a valid WatchVault JSON backup.");
      }
    };
    reader.readAsText(file);
  };

  const clearLocalData = () => {
    const ok = window.confirm("Clear local preferences and cached WebView data? Your live backend data will remain on Render.");
    if (!ok) return;
    window.localStorage.removeItem("watchvault:prefs");
    window.localStorage.clear();
    reset();
    showMessage("Local app data cleared. Restarting...");
    window.setTimeout(() => window.location.reload(), 700);
  };

  const pageTitle = page === "main" ? "Settings" : page.charAt(0).toUpperCase() + page.slice(1);

  return (
    <div className="h-full overflow-y-auto pb-28">
      <div className="px-5 pt-12 flex items-center gap-3">
        <button
          onClick={() => (page === "main" ? onBack() : setPage("main"))}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-center"
          aria-label="Go back"
        >
          <ArrowLeft size={16} className="text-[#111] dark:text-white" />
        </button>
        <div className="text-[#111] dark:text-white" style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
          {pageTitle}
        </div>
      </div>

      {page === "main" && (
        <>
          <Section title="Theme">
            <div className="grid grid-cols-3 gap-2">
              {(["light", "dark", "amoled"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`p-3 capitalize ${theme === t ? "bg-[#111] text-white dark:bg-white dark:text-black" : "bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white"}`}
                  style={{ borderRadius: 20, fontSize: 12, fontWeight: 600 }}
                >
                  {t}
                </button>
              ))}
            </div>
          </Section>

          <SettingsGroup title="Preferences">
            <Row label="Profile name" value={prefs.name} onClick={() => setPage("profile")} />
            <Row label="Default region" value={prefs.regionName} onClick={() => setPage("region")} />
            <Row label="Preferred languages" value={prefs.languages.join(", ")} onClick={() => setPage("languages")} />
            <Row label="Content types" value={prefs.contentTypes.join(", ")} onClick={() => setPage("content")} />
            <Row label="Notification reminders" value={reminderPermissionLabel(prefs.remindersEnabled)} onClick={() => void toggleReminders()} />
          </SettingsGroup>

          <SettingsGroup title="Data">
            <Row label="Backup / Export data" value="JSON" onClick={() => setPage("data")} />
            <Row label="Import data" value="JSON" onClick={() => fileInputRef.current?.click()} />
            <Row label="Clear local data" value="Reset" onClick={clearLocalData} danger />
          </SettingsGroup>

          <SettingsGroup title="System">
            <Row label="API status" value={`${apiStatus.length || 0} services`} onClick={() => setPage("api")} />
            <Row label="Refresh live data" value="Now" onClick={() => refresh().then(() => showMessage("Latest backend data loaded."))} />
            <Row label="About WatchVault" value="v1.0.0" onClick={() => setPage("about")} />
          </SettingsGroup>
        </>
      )}

      {page === "profile" && (
        <Section title="Profile name">
          <input
            value={prefs.name}
            onChange={(e) => update({ name: e.target.value })}
            className="w-full p-4 rounded-3xl bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white"
            placeholder="Enter your name"
          />
          <p className="mt-3 text-[#666666]" style={{ fontSize: 12 }}>This name is used across Home and Profile.</p>
        </Section>
      )}

      {page === "region" && (
        <SettingsGroup title="Select region">
          {REGIONS.map((region) => (
            <Row
              key={region.code}
              label={region.name}
              value={prefs.regionCode === region.code ? "Selected" : region.code}
              onClick={() => update({ regionCode: region.code, regionName: region.name })}
            />
          ))}
        </SettingsGroup>
      )}

      {page === "languages" && (
        <SettingsGroup title="Preferred languages">
          {LANGUAGES.map((language) => {
            const active = prefs.languages.includes(language);
            return (
              <Row
                key={language}
                label={language}
                value={active ? "On" : "Off"}
                onClick={() => update({ languages: active ? prefs.languages.filter((l) => l !== language) : [...prefs.languages, language] })}
              />
            );
          })}
        </SettingsGroup>
      )}

      {page === "content" && (
        <SettingsGroup title="Content types">
          {CONTENT_TYPES.map((type) => {
            const active = prefs.contentTypes.includes(type);
            return (
              <Row
                key={type}
                label={type}
                value={active ? "On" : "Off"}
                onClick={() => update({ contentTypes: active ? prefs.contentTypes.filter((t) => t !== type) : [...prefs.contentTypes, type] })}
              />
            );
          })}
        </SettingsGroup>
      )}

      {page === "data" && (
        <Section title="Backup and import">
          <button onClick={exportData} className="w-full py-4 rounded-full bg-[#111] text-white dark:bg-white dark:text-black flex items-center justify-center gap-2" style={{ fontSize: 13, fontWeight: 700 }}>
            <Download size={16} /> Export JSON backup
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="w-full mt-3 py-4 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white flex items-center justify-center gap-2" style={{ fontSize: 13, fontWeight: 700 }}>
            <Upload size={16} /> Import JSON backup
          </button>
          <button onClick={clearLocalData} className="w-full mt-3 py-4 rounded-full bg-red-500 text-white flex items-center justify-center gap-2" style={{ fontSize: 13, fontWeight: 700 }}>
            <Trash2 size={16} /> Clear local app data
          </button>
        </Section>
      )}

      {page === "api" && (
        <Section title="Live API status">
          <div className="text-[#666666] mb-3" style={{ fontSize: 11, wordBreak: "break-all" }}>{API_BASE_URL}</div>
          <button onClick={() => refresh().then(() => showMessage("API status refreshed."))} className="mb-3 w-full py-3 rounded-full bg-[#111] text-white dark:bg-white dark:text-black flex items-center justify-center gap-2" style={{ fontSize: 12, fontWeight: 700 }}>
            <RefreshCw size={15} /> Refresh status
          </button>
          <div className="grid grid-cols-2 gap-2">
            {apiStatus.map((api) => (
              <div key={api.name} className="p-3 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]" style={{ borderRadius: 20 }}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className={api.state === "key_missing" ? "text-red-500" : "text-[#D9A441]"} />
                  <div className="text-[#111] dark:text-white" style={{ fontSize: 13, fontWeight: 600 }}>{api.name}</div>
                </div>
                <div className="mt-1.5 text-[#666666] dark:text-[#B8B8B8]" style={{ fontSize: 10, lineHeight: 1.4 }}>{api.state}</div>
              </div>
            ))}
            {!apiStatus.length && <div className="col-span-2 text-[#666666]" style={{ fontSize: 12 }}>No API status returned yet. Refresh after Render is live.</div>}
          </div>
        </Section>
      )}

      {page === "about" && (
        <Section title="About WatchVault">
          <div className="p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#666666]" style={{ borderRadius: 20, fontSize: 12, lineHeight: 1.6 }}>
            WatchVault tracks movies, series, anime, release dates, legal providers, and watch progress. It does not stream or provide pirated content.
          </div>
          <div className="mt-3 p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#666666]" style={{ borderRadius: 20, fontSize: 11, lineHeight: 1.5 }}>
            This product uses TMDB, OMDb, AniList, Jikan, and Watchmode data where configured. This product is not endorsed or certified by TMDB.
          </div>
        </Section>
      )}

      <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={(e) => importData(e.target.files?.[0] || null)} />

      {message && (
        <div className="fixed left-5 right-5 bottom-28 z-50 p-3 rounded-2xl bg-[#D9A441] text-black shadow-xl" style={{ fontSize: 12, fontWeight: 700 }}>
          {message}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 mt-5">
      <div className="text-[#666666] mb-2 px-1" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
      {children}
    </div>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Section title={title}>
      <div className="bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] overflow-hidden" style={{ borderRadius: 24 }}>
        {children}
      </div>
    </Section>
  );
}

function Row({ label, value, onClick, danger }: { label: string; value?: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-3.5 border-b last:border-b-0 border-[#E5E5E5] dark:border-[#2A2A2A] text-left">
      <span className={danger ? "text-red-500" : "text-[#111] dark:text-white"} style={{ fontSize: 13 }}>{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        {value && <span className="text-[#666666] truncate max-w-[150px]" style={{ fontSize: 12 }}>{value}</span>}
        <ChevronRight size={14} className="text-[#666666] flex-shrink-0" />
      </div>
    </button>
  );
}
