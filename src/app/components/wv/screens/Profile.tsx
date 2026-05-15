import { useState } from "react";
import { Settings, ChevronRight, Sparkles } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, XAxis } from "recharts";
import { useLiveData } from "../../../services/liveData";
import { usePrefs } from "../prefs";

export function Profile({ onSettings, onBrain }: { onSettings: () => void; onBrain: () => void }) {
  const { insights, stats } = useLiveData();
  const { prefs } = usePrefs();
  const [recapOpen, setRecapOpen] = useState(false);
  const displayName = prefs.name?.trim() || "Ansh";
  const initial = displayName.charAt(0).toUpperCase() || "A";

  const statCards = [
    { label: "Movies watched", value: stats.moviesWatched },
    { label: "Episodes watched", value: stats.episodesWatched },
    { label: "Anime completed", value: stats.animeCompleted },
    { label: "Watch hours", value: stats.watchHours },
    { label: "Pending titles", value: stats.pendingTitles },
    { label: "Completion rate", value: `${stats.completionRatePercent}%` },
  ];

  return (
    <div className="h-full overflow-y-auto pb-28 ">
      <div className="px-5 pt-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#D9A441] flex items-center justify-center text-white" style={{ fontSize: 20, fontWeight: 700 }}>
            {initial}
          </div>
          <div>
            <div className="text-[#111] dark:text-white" style={{ fontSize: 20, fontWeight: 700 }}>
              {displayName}
            </div>
            <div className="text-[#666666]" style={{ fontSize: 12 }}>
              Real library stats
            </div>
          </div>
        </div>
        <button
          onClick={onSettings}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-center"
          aria-label="Open settings"
        >
          <Settings size={16} className="text-[#111] dark:text-white" />
        </button>
      </div>

      <div className="px-5 mt-5 grid grid-cols-2 gap-3">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]"
            style={{ borderRadius: 24 }}
          >
            <div className="text-[#111] dark:text-white" style={{ fontSize: 22, fontWeight: 700 }}>
              {s.value}
            </div>
            <div className="text-[#666666] mt-1" style={{ fontSize: 11 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 mt-5">
        <div
          className="p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]"
          style={{ borderRadius: 24 }}
        >
          <div className="text-[#111] dark:text-white mb-3" style={{ fontSize: 14, fontWeight: 600 }}>
            Monthly watch hours
          </div>
          {stats.monthlyHours.length ? (
            <>
              <div style={{ width: "100%", height: 120 }}>
                <ResponsiveContainer>
                  <BarChart data={stats.monthlyHours}>
                    <XAxis dataKey="m" tick={{ fill: "#666666", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Bar dataKey="h" fill="#D9A441" radius={[8, 8, 0, 0]} />
                    <Tooltip cursor={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-[#666666]" style={{ fontSize: 12 }}>
              No watch history yet.
            </div>
          )}
        </div>
      </div>

      <div className="px-5 mt-3">
        <div
          className="p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]"
          style={{ borderRadius: 24 }}
        >
          <div className="text-[#111] dark:text-white mb-3" style={{ fontSize: 14, fontWeight: 600 }}>
            Genre distribution
          </div>
          {stats.genreDistribution.length ? (
            <div className="flex items-center">
              <div style={{ width: 120, height: 120 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={stats.genreDistribution} dataKey="v" innerRadius={28} outerRadius={50} paddingAngle={2}>
                      {stats.genreDistribution.map((g) => (
                        <Cell key={g.name} fill={g.c} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {stats.genreDistribution.map((g) => (
                  <div key={g.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: g.c }} />
                    <div className="text-[#111] dark:text-white flex-1" style={{ fontSize: 12 }}>
                      {g.name}
                    </div>
                    <div className="text-[#666666]" style={{ fontSize: 11 }}>
                      {g.v}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[#666666]" style={{ fontSize: 12 }}>
              Mark titles watched to build this chart.
            </div>
          )}
        </div>
      </div>

      <div className="px-5 mt-3">
        <div
          className="p-5 bg-gradient-to-br from-[#111] to-[#D9A441] text-white"
          style={{ borderRadius: 28 }}
        >
          <div className="text-white/70" style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
            Watch Recap
          </div>
          <div className="mt-1" style={{ fontSize: 20, fontWeight: 700 }}>
            {stats.watchHours ? `${stats.watchHours} real hours tracked` : "No completed watch time yet"}
          </div>
          <button
            onClick={() => setRecapOpen(true)}
            className="mt-4 px-4 py-2 rounded-full bg-white text-black"
            style={{ fontSize: 12, fontWeight: 600 }}
          >
            View Recap
          </button>
        </div>
      </div>

      <button
        onClick={onBrain}
        className="mx-5 mt-3 w-[calc(100%-2.5rem)] p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-between"
        style={{ borderRadius: 24 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#D9A441]/15 flex items-center justify-center">
            <Sparkles size={16} className="text-[#D9A441]" />
          </div>
          <div className="text-left">
            <div className="text-[#111] dark:text-white" style={{ fontSize: 13, fontWeight: 600 }}>
              Watch Brain
            </div>
            <div className="text-[#666666]" style={{ fontSize: 11 }}>
              {insights.length ? `${insights.length} insights ready` : "No insights yet"}
            </div>
          </div>
        </div>
        <ChevronRight size={16} className="text-[#666666]" />
      </button>

      {recapOpen && (
        <div className="absolute inset-0 bg-black/40 flex items-end z-30" onClick={() => setRecapOpen(false)}>
          <div className="w-full bg-white dark:bg-[#111111] p-5 pb-8" style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-[#E5E5E5] mx-auto mb-4" />
            <div className="text-[#111] dark:text-white" style={{ fontSize: 18, fontWeight: 700 }}>Watch Recap</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {statCards.slice(0, 4).map((s) => (
                <div key={s.label} className="p-3 rounded-2xl bg-[#F6F6F6] dark:bg-[#1A1A1A]">
                  <div className="text-[#111] dark:text-white" style={{ fontSize: 18, fontWeight: 700 }}>{s.value}</div>
                  <div className="text-[#666666]" style={{ fontSize: 10 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setRecapOpen(false)} className="mt-4 w-full py-3 rounded-full bg-[#111] text-white dark:bg-white dark:text-black" style={{ fontSize: 13, fontWeight: 700 }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
