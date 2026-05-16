import { useMemo, useState } from "react";
import { Settings, ChevronRight, Sparkles, Trophy, Clock3, Film, Tv, Bookmark, Target } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, XAxis } from "recharts";
import { useLiveData } from "../../../services/liveData";
import { usePrefs } from "../prefs";
import { useProfileImage } from "../../../services/profileImage";

export function Profile({ onSettings, onBrain }: { onSettings: () => void; onBrain: () => void }) {
  const { insights, stats } = useLiveData();
  const { prefs } = usePrefs();
  const profileImage = useProfileImage();
  const [recapOpen, setRecapOpen] = useState(false);
  const displayName = prefs.name?.trim() || "Watcher";
  const initial = displayName.charAt(0).toUpperCase() || "W";

  const safeStats = useMemo(() => ({
    moviesWatched: Number(stats.moviesWatched || 0),
    episodesWatched: Number(stats.episodesWatched || 0),
    animeCompleted: Number(stats.animeCompleted || 0),
    watchHours: Number(stats.watchHours || 0),
    pendingTitles: Number(stats.pendingTitles || 0),
    completionRatePercent: Math.max(0, Math.min(100, Number(stats.completionRatePercent || 0))),
    monthlyHours: stats.monthlyHours || [],
    genreDistribution: stats.genreDistribution || [],
  }), [stats]);

  const statCards = [
    { label: "Movies watched", value: safeStats.moviesWatched, Icon: Film, sub: "Completed films" },
    { label: "Episodes watched", value: safeStats.episodesWatched, Icon: Tv, sub: "Series progress" },
    { label: "Anime completed", value: safeStats.animeCompleted, Icon: Trophy, sub: "Finished anime" },
    { label: "Watch hours", value: safeStats.watchHours, Icon: Clock3, sub: "Tracked time" },
    { label: "Pending titles", value: safeStats.pendingTitles, Icon: Bookmark, sub: "Saved for later" },
    { label: "Completion rate", value: `${safeStats.completionRatePercent}%`, Icon: Target, sub: "Finished ratio" },
  ];

  const hasRealStats = safeStats.moviesWatched + safeStats.episodesWatched + safeStats.animeCompleted + safeStats.watchHours + safeStats.pendingTitles > 0;

  return (
    <div className="h-full overflow-y-auto pb-32">
      <div className="px-5 pt-14 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-16 h-16 rounded-full bg-[#D9A441] flex items-center justify-center text-white shadow-[0_18px_45px_-25px_rgba(217,164,65,0.9)] overflow-hidden" style={{ fontSize: 22, fontWeight: 900 }}>
            {profileImage ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" /> : initial}
          </div>
          <div className="min-w-0">
            <div className="text-[#111] dark:text-white truncate" style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>
              {displayName}
            </div>
            <div className="text-[#666666]" style={{ fontSize: 12 }}>
              Your WatchVault progress
            </div>
          </div>
        </div>
        <button
          onClick={onSettings}
          className="w-12 h-12 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-center shadow-[0_14px_35px_-24px_rgba(0,0,0,0.8)]"
          aria-label="Open settings"
        >
          <Settings size={18} className="text-[#111] dark:text-white" />
        </button>
      </div>

      <div className="px-5 mt-5">
        <div className="p-5 bg-gradient-to-br from-[#111111] via-[#151515] to-[#2A2110] border border-white/10 text-white" style={{ borderRadius: 30 }}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-white/60" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>Progress Score</div>
              <div className="mt-1" style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1 }}>{safeStats.completionRatePercent}%</div>
              <div className="text-white/60" style={{ fontSize: 12 }}>Based on titles you finished</div>
            </div>
            <div className="relative w-24 h-24 rounded-full bg-white/8 border border-white/10 flex items-center justify-center">
              <div className="absolute inset-2 rounded-full border-[8px] border-white/10" />
              <div className="absolute inset-2 rounded-full border-[8px] border-[#D9A441]" style={{ clipPath: `inset(${100 - safeStats.completionRatePercent}% 0 0 0)` }} />
              <Trophy size={30} className="text-[#D9A441] relative" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        {statCards.map(({ label, value, Icon, sub }) => (
          <div
            key={label}
            className="p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] shadow-[0_14px_40px_-32px_rgba(0,0,0,0.8)]"
            style={{ borderRadius: 24 }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="w-9 h-9 rounded-full bg-[#D9A441]/15 flex items-center justify-center">
                <Icon size={16} className="text-[#D9A441]" />
              </div>
              <div className="text-[#111] dark:text-white" style={{ fontSize: 24, fontWeight: 900 }}>{value}</div>
            </div>
            <div className="text-[#111] dark:text-white mt-3" style={{ fontSize: 12, fontWeight: 800 }}>{label}</div>
            <div className="text-[#666666] mt-0.5" style={{ fontSize: 10 }}>{sub}</div>
          </div>
        ))}
      </div>

      {!hasRealStats && (
        <div className="mx-5 mt-4 p-4 rounded-3xl bg-white/8 border border-white/10 text-white/70" style={{ fontSize: 12, lineHeight: 1.5 }}>
          Start tracking titles from Details and Episode Tracker to build real stats here.
        </div>
      )}

      <div className="px-5 mt-5">
        <div className="p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]" style={{ borderRadius: 26 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[#111] dark:text-white" style={{ fontSize: 15, fontWeight: 900 }}>Monthly watch hours</div>
            <div className="text-[#666666]" style={{ fontSize: 11 }}>{safeStats.watchHours}h total</div>
          </div>
          {safeStats.monthlyHours.length ? (
            <div style={{ width: "100%", height: 150 }}>
              <ResponsiveContainer>
                <BarChart data={safeStats.monthlyHours} barCategoryGap={18}>
                  <XAxis dataKey="m" tick={{ fill: "#777777", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Bar dataKey="h" fill="#D9A441" radius={[10, 10, 10, 10]} />
                  <Tooltip cursor={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-10 text-center text-[#666666]" style={{ fontSize: 12 }}>No watch history yet.</div>
          )}
        </div>
      </div>

      <div className="px-5 mt-3">
        <div className="p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]" style={{ borderRadius: 26 }}>
          <div className="text-[#111] dark:text-white mb-3" style={{ fontSize: 15, fontWeight: 900 }}>Genre distribution</div>
          {safeStats.genreDistribution.length ? (
            <div className="flex items-center gap-3">
              <div style={{ width: 132, height: 132 }} className="flex-shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={safeStats.genreDistribution} dataKey="v" innerRadius={34} outerRadius={58} paddingAngle={2}>
                      {safeStats.genreDistribution.map((g) => <Cell key={g.name} fill={g.c} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {safeStats.genreDistribution.slice(0, 6).map((g) => (
                  <div key={g.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: g.c }} />
                    <div className="text-[#111] dark:text-white flex-1 truncate" style={{ fontSize: 12 }}>{g.name}</div>
                    <div className="text-[#666666]" style={{ fontSize: 11 }}>{g.v}%</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-[#666666]" style={{ fontSize: 12 }}>Mark titles watched to build this chart.</div>
          )}
        </div>
      </div>

      <div className="px-5 mt-3">
        <div className="p-5 bg-gradient-to-br from-[#111] to-[#D9A441] text-white" style={{ borderRadius: 28 }}>
          <div className="text-white/70" style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>Watch Recap</div>
          <div className="mt-1" style={{ fontSize: 20, fontWeight: 800 }}>{safeStats.watchHours ? `${safeStats.watchHours} hours tracked` : "No completed watch time yet"}</div>
          <button onClick={() => setRecapOpen(true)} className="mt-4 px-4 py-2 rounded-full bg-white text-black" style={{ fontSize: 12, fontWeight: 800 }}>View Recap</button>
        </div>
      </div>

      <button onClick={onBrain} className="mx-5 mt-3 w-[calc(100%-2.5rem)] p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-between" style={{ borderRadius: 24 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#D9A441]/15 flex items-center justify-center">
            <Sparkles size={16} className="text-[#D9A441]" />
          </div>
          <div className="text-left">
            <div className="text-[#111] dark:text-white" style={{ fontSize: 13, fontWeight: 800 }}>Watch Brain</div>
            <div className="text-[#666666]" style={{ fontSize: 11 }}>{insights.length ? `${insights.length} insights ready` : "No insights yet"}</div>
          </div>
        </div>
        <ChevronRight size={16} className="text-[#666666]" />
      </button>

      {recapOpen && (
        <div className="absolute inset-0 bg-black/40 flex items-end z-30" onClick={() => setRecapOpen(false)}>
          <div className="w-full bg-white dark:bg-[#111111] p-5 pb-8" style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-[#E5E5E5] mx-auto mb-4" />
            <div className="text-[#111] dark:text-white" style={{ fontSize: 18, fontWeight: 800 }}>Watch Recap</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {statCards.slice(0, 4).map((s) => (
                <div key={s.label} className="p-3 rounded-2xl bg-[#F6F6F6] dark:bg-[#1A1A1A]">
                  <div className="text-[#111] dark:text-white" style={{ fontSize: 18, fontWeight: 800 }}>{s.value}</div>
                  <div className="text-[#666666]" style={{ fontSize: 10 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setRecapOpen(false)} className="mt-4 w-full py-3 rounded-full bg-[#111] text-white dark:bg-white dark:text-black" style={{ fontSize: 13, fontWeight: 800 }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}