import { ArrowLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useLiveData } from "../../../services/liveData";
import { CURRENT_APP_VERSION, checkForAppUpdate, openUpdateUrl, type AppUpdateInfo } from "../../../services/appUpdate";
import { reminderPermissionLabel, requestReminderPermission } from "../../../services/notifications";
import { CONTENT_TYPES, LANGUAGES, REGIONS, usePrefs } from "../prefs";

type SettingsPage = "main" | "profile" | "region" | "languages" | "content" | "updates" | "about";

export function SettingsScreen({
  onBack,
  theme,
  setTheme,
}: {
  onBack: () => void;
  theme: "light" | "dark" | "amoled";
  setTheme: (t: "light" | "dark" | "amoled") => void;
}) {
  const { refresh } = useLiveData();
  const { prefs, update, reset } = usePrefs();
  const [page, setPage] = useState<SettingsPage>("main");
  const [message, setMessage] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);

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

  const checkUpdates = async () => {
    setCheckingUpdate(true);
    try {
      const info = await checkForAppUpdate();
      setUpdateInfo(info);
      showMessage(info.updateAvailable ? "New update is available." : "You are using the latest version.");
    } catch {
      showMessage("Could not check for updates right now.");
    } finally {
      setCheckingUpdate(false);
    }
  };

  const clearSavedPreferences = () => {
    const ok = window.confirm("Clear your saved preferences from this device?");
    if (!ok) return;
    reset();
    window.localStorage.removeItem("watchvault:prefs");
    showMessage("Saved preferences cleared. Restarting...");
    window.setTimeout(() => window.location.reload(), 700);
  };

  const titleMap: Record<SettingsPage, string> = {
    main: "Settings",
    profile: "Profile",
    region: "Region",
    languages: "Languages",
    content: "Content",
    updates: "App Update",
    about: "About",
  };

  const languageSummary = prefs.languages.length ? prefs.languages.join(", ") : "None selected";
  const contentSummary = prefs.contentTypes.length ? prefs.contentTypes.join(", ") : "None selected";
  const latestVersion = updateInfo?.latestVersion || "Check now";

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
          {titleMap[page]}
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
            <Row label="Profile name" value={prefs.name || "Not set"} onClick={() => setPage("profile")} />
            <Row label="Default region" value={prefs.regionName} onClick={() => setPage("region")} />
            <Row label="Preferred languages" value={languageSummary} onClick={() => setPage("languages")} />
            <Row label="Content types" value={contentSummary} onClick={() => setPage("content")} />
            <SwitchRow label="Release reminders" value={reminderPermissionLabel(prefs.remindersEnabled)} active={prefs.remindersEnabled} onClick={() => void toggleReminders()} />
          </SettingsGroup>

          <SettingsGroup title="App">
            <Row label="App update" value={latestVersion} onClick={() => setPage("updates")} />
            <Row label="Refresh content" value="Now" onClick={() => refresh().then(() => showMessage("Latest content loaded."))} />
            <Row label="Clear saved preferences" value="Reset" onClick={clearSavedPreferences} danger />
            <Row label="About WatchVault" value={`v${CURRENT_APP_VERSION}`} onClick={() => setPage("about")} />
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
          {REGIONS.map((region) => {
            const active = prefs.regionCode === region.code;
            return (
              <SwitchRow
                key={region.code}
                label={region.name}
                value={active ? "On" : "Off"}
                active={active}
                onClick={() => update({ regionCode: region.code, regionName: region.name })}
              />
            );
          })}
        </SettingsGroup>
      )}

      {page === "languages" && (
        <SettingsGroup title="Preferred languages">
          {LANGUAGES.map((language) => {
            const active = prefs.languages.includes(language);
            return (
              <SwitchRow
                key={language}
                label={language}
                value={active ? "On" : "Off"}
                active={active}
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
              <SwitchRow
                key={type}
                label={type}
                value={active ? "On" : "Off"}
                active={active}
                onClick={() => update({ contentTypes: active ? prefs.contentTypes.filter((t) => t !== type) : [...prefs.contentTypes, type] })}
              />
            );
          })}
        </SettingsGroup>
      )}

      {page === "updates" && (
        <Section title="Update status">
          <div className="p-5 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]" style={{ borderRadius: 26 }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[#111] dark:text-white" style={{ fontSize: 18, fontWeight: 800 }}>WatchVault</div>
                <div className="text-[#666666] mt-1" style={{ fontSize: 12 }}>Current version: v{CURRENT_APP_VERSION}</div>
                <div className="text-[#666666]" style={{ fontSize: 12 }}>Latest version: {updateInfo?.latestVersion ? `v${updateInfo.latestVersion}` : "Not checked"}</div>
              </div>
              <div className={`px-3 py-1.5 rounded-full ${updateInfo?.updateAvailable ? "bg-[#D9A441]/20 text-[#D9A441]" : "bg-white/10 text-[#666666]"}`} style={{ fontSize: 11, fontWeight: 800 }}>
                {updateInfo?.updateAvailable ? "Update ready" : "Up to date"}
              </div>
            </div>

            {updateInfo?.notes && (
              <div className="mt-4 p-3 rounded-2xl bg-[#F6F6F6] dark:bg-[#1A1A1A] text-[#666666] whitespace-pre-line" style={{ fontSize: 12, lineHeight: 1.5 }}>
                {updateInfo.notes.slice(0, 500)}
              </div>
            )}

            <button
              onClick={() => void checkUpdates()}
              disabled={checkingUpdate}
              className="mt-4 w-full py-3 rounded-full bg-white dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ fontSize: 13, fontWeight: 800 }}
            >
              <RefreshCw size={15} /> {checkingUpdate ? "Checking..." : "Check for Update"}
            </button>

            {updateInfo?.updateAvailable && updateInfo.apkUrl && (
              <button
                onClick={() => openUpdateUrl(updateInfo.apkUrl!)}
                className="mt-3 w-full py-3 rounded-full bg-[#D9A441] text-black flex items-center justify-center gap-2"
                style={{ fontSize: 13, fontWeight: 900 }}
              >
                <Download size={15} /> Update Now
              </button>
            )}
          </div>
        </Section>
      )}

      {page === "about" && (
        <Section title="About WatchVault">
          <div className="p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#666666]" style={{ borderRadius: 20, fontSize: 12, lineHeight: 1.6 }}>
            WatchVault tracks movies, series, anime, release dates, legal watch options, and watch progress. It does not stream content or provide pirated links.
          </div>
        </Section>
      )}

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

function SwitchRow({ label, value, active, onClick }: { label: string; value: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-3.5 border-b last:border-b-0 border-[#E5E5E5] dark:border-[#2A2A2A] text-left">
      <span className="text-[#111] dark:text-white" style={{ fontSize: 13 }}>{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-[#666666]" style={{ fontSize: 12 }}>{value}</span>
        <span className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${active ? "bg-[#D9A441]" : "bg-[#2A2A2A] border border-white/10"}`}>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${active ? "translate-x-6" : "translate-x-1"}`} />
        </span>
      </div>
    </button>
  );
}