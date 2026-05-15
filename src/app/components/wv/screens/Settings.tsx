import { ArrowLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useLiveData } from "../../../services/liveData";

export function SettingsScreen({
  onBack,
  theme,
  setTheme,
}: {
  onBack: () => void;
  theme: "light" | "dark" | "amoled";
  setTheme: (t: "light" | "dark" | "amoled") => void;
}) {
  const { apiStatus } = useLiveData();
  const [message, setMessage] = useState<string | null>(null);
  const groups: { title: string; items: { label: string; value?: string }[] }[] = [
    {
      title: "Preferences",
      items: [
        { label: "Notification reminders", value: "On" },
        { label: "Default region", value: "India" },
        { label: "Preferred languages", value: "EN, JP" },
      ],
    },
    {
      title: "Data",
      items: [
        { label: "Backup data" },
        { label: "Import data" },
        { label: "Clear local data" },
        { label: "API status", value: "Connected" },
      ],
    },
    {
      title: "About",
      items: [{ label: "About WatchVault", value: "v1.0.0" }],
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
                onClick={() => setMessage(`${it.label}: ${it.value || "Ready"}`)}
                className={`w-full flex items-center justify-between px-4 py-3.5 ${i > 0 ? "border-t border-[#E5E5E5] dark:border-[#2A2A2A]" : ""}`}
              >
                <span className="text-[#111] dark:text-white" style={{ fontSize: 13 }}>
                  {it.label}
                </span>
                <div className="flex items-center gap-2">
                  {it.value && (
                    <span className="text-[#666666]" style={{ fontSize: 12 }}>
                      {it.value}
                    </span>
                  )}
                  <ChevronRight size={14} className="text-[#666666]" />
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
