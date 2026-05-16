import { ArrowLeft, ChevronRight, CheckCircle2, Bell } from "lucide-react";
import { useState } from "react";
import { useLiveData } from "../../../services/liveData";
import { reminderPermissionLabel, requestReminderPermission } from "../../../services/notifications";
import { usePrefs } from "../prefs";

export function SettingsScreen({
  onBack,
  theme,
  setTheme,
}: {
  onBack: () => void;
  theme: "light" | "dark" | "amoled";
  setTheme: (t: "light" | "dark" | "amoled") => void;
}) {
  const { apiStatus, refresh } = useLiveData();
  const { prefs, update } = usePrefs();
  const [message, setMessage] = useState<string | null>(null);

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 3500);
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

  const groups: { title: string; items: { label: string; value?: string; onClick: () => void }[] }[] = [
    {
      title: "Preferences",
      items: [
        { label: "Notification reminders", value: reminderPermissionLabel(prefs.remindersEnabled), onClick: toggleReminders },
        { label: "Default region", value: prefs.regionName, onClick: () => showMessage(`Region: ${prefs.regionName}`) },
        { label: "Preferred languages", value: prefs.languages.join(", "), onClick: () => showMessage(`Languages: ${prefs.languages.join(", ")}`) },
      ],
    },
    {
      title: "Data",
      items: [
        { label: "Refresh live data", value: "Now", onClick: () => refresh().then(() => showMessage("Latest backend data loaded.")) },
        { label: "Backup data", value: "Soon", onClick: () => showMessage("Backup export will be available in the advanced settings page.") },
        { label: "Import data", value: "Soon", onClick: () => showMessage("Import will be available in the advanced settings page.") },
        { label: "API status", value: `${apiStatus.length} services`, onClick: () => showMessage("API status is shown below.") },
      ],
    },
    {
      title: "About",
      items: [{ label: "About WatchVault", value: "v1.0.0", onClick: () => showMessage("WatchVault tracks legal metadata and watch progress. It does not stream content.") }],
    },
  ];

  return (
    <div className="h-full overflow-y-auto pb-28 ">
      <div className="px-5 pt-12 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-center">
          <ArrowLeft size={16} className="text-[#111] dark:text-white" />
        </button>
        <div className="text-[#111] dark:text-white" style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
          Settings
        </div>
      </div>

      <div className="px-5 mt-5">
        <div className="text-[#666666] mb-2 px-1" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
          Theme
        </div>
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
      </div>

      <div className="px-5 mt-5">
        <div
          className="p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center gap-3"
          style={{ borderRadius: 24 }}
        >
          <div className="w-11 h-11 rounded-full bg-[#D9A441]/15 flex items-center justify-center">
            <Bell size={17} className="text-[#D9A441]" />
          </div>
          <div className="flex-1">
            <div className="text-[#111] dark:text-white" style={{ fontSize: 14, fontWeight: 700 }}>Reminder permissions</div>
            <div className="text-[#666666] dark:text-[#B8B8B8]" style={{ fontSize: 11, lineHeight: 1.5 }}>
              You can change reminders anytime from Settings. Enabling asks for device/browser notification permission.
            </div>
          </div>
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.title} className="px-5 mt-5">
          <div className="text-[#666666] mb-2 px-1" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
            {g.title}
          </div>
          <div
            className="bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] overflow-hidden"
            style={{ borderRadius: 24 }}
          >
            {g.items.map((it, i) => (
              <button
                key={it.label}
                onClick={it.onClick}
                className={`w-full flex items-center justify-between px-4 py-3.5 ${i > 0 ? "border-t border-[#E5E5E5] dark:border-[#2A2A2A]" : ""}`}
              >
                <span className="text-[#111] dark:text-white" style={{ fontSize: 13 }}>
                  {it.label}
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  {it.value && (
                    <span className="text-[#666666] truncate max-w-[150px]" style={{ fontSize: 12 }}>
                      {it.value}
                    </span>
                  )}
                  <ChevronRight size={14} className="text-[#666666] flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {message && (
        <div className="mx-5 mt-4 p-3 rounded-2xl bg-[#D9A441]/15 text-[#7A5A1F] dark:text-[#D9A441]" style={{ fontSize: 12, fontWeight: 600 }}>
          {message}
        </div>
      )}

      <div className="px-5 mt-5">
        <div className="text-[#666666] mb-2 px-1" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
          API Status
        </div>
        <div className="grid grid-cols-2 gap-2">
          {apiStatus.map((api) => (
            <div
              key={api.name}
              className="p-3 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]"
              style={{ borderRadius: 20 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#DDF7F1] dark:bg-[#D9A441]/15 flex items-center justify-center">
                  <CheckCircle2 size={14} className="text-[#D9A441]" />
                </div>
                <div className="text-[#111] dark:text-white" style={{ fontSize: 13, fontWeight: 600 }}>
                  {api.name}
                </div>
              </div>
              <div className="mt-1.5 text-[#666666] dark:text-[#B8B8B8]" style={{ fontSize: 10, lineHeight: 1.4 }}>
                {api.state === "ready" ? "Ready" : api.state}
              </div>
            </div>
          ))}
        </div>
        <div
          className="mt-3 p-3 bg-[#DDF7F1] dark:bg-[#D9A441]/10 text-[#7A5A1F] dark:text-[#00C2A8]"
          style={{ borderRadius: 16, fontSize: 11, lineHeight: 1.5 }}
        >
          Live data is loaded through the backend proxy from TMDB, OMDb, AniList, Jikan, and Watchmode.
        </div>
      </div>

      <div className="px-5 mt-5">
        <div
          className="p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#666666]"
          style={{ borderRadius: 20, fontSize: 11, lineHeight: 1.5 }}
        >
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </div>
      </div>
    </div>
  );
}