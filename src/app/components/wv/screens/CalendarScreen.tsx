import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Film, PlayCircle, Tv } from "lucide-react";
import { useLiveData } from "../../../services/liveData";
import type { Media } from "../../../data";
import { ImageWithFallback } from "../../figma/ImageWithFallback";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

type CalendarEvent = {
  type: "release" | "reminder" | "watched";
  title: string;
  media: Media;
};

function readableDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function releaseLabel(media: Media) {
  if (media.releaseType === "episode" || media.releaseType === "anime_episode") {
    const season = media.seasonNumber ? `S${media.seasonNumber}` : null;
    const episode = media.episodeNumber ? `E${media.episodeNumber}` : null;
    const prefix = [season, episode].filter(Boolean).join(" ");
    const type = media.releaseType === "anime_episode" ? "Anime episode" : "Episode release";
    return prefix ? `${prefix} • ${type}` : type;
  }

  if (media.releaseType === "season") return "Season release";
  return `${media.type} release`;
}

function releaseTitle(media: Media) {
  if (media.releaseType === "episode" || media.releaseType === "anime_episode") {
    return media.parentTitle || media.title;
  }
  return media.title;
}

function releaseSubtitle(media: Media) {
  if ((media.releaseType === "episode" || media.releaseType === "anime_episode") && media.episodeTitle) {
    return media.episodeTitle;
  }
  return releaseLabel(media);
}

function ReleaseIcon({ media }: { media: Media }) {
  if (media.type === "Movie") return <Film size={15} className="text-[#D9A441]" />;
  if (media.releaseType === "episode" || media.releaseType === "anime_episode") return <PlayCircle size={15} className="text-[#D9A441]" />;
  return <Tv size={15} className="text-[#D9A441]" />;
}

export function CalendarScreen() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today.getDate());
  const { upcoming } = useLiveData();
  const month = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstDay = viewDate.getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

  const events = useMemo(() => upcoming.reduce<Record<number, CalendarEvent[]>>((acc, item) => {
    if (!item.releaseDate) return acc;
    const date = new Date(item.releaseDate);
    if (Number.isNaN(date.getTime())) return acc;
    if (date.getFullYear() !== viewDate.getFullYear() || date.getMonth() !== viewDate.getMonth()) return acc;
    const day = date.getDate();
    acc[day] = [...(acc[day] || []), { type: "release", title: releaseTitle(item), media: item }];
    return acc;
  }, {}), [upcoming, viewDate]);

  const allMonthEvents = useMemo(() => Object.entries(events)
    .flatMap(([day, items]) => items.map((item) => ({ day: Number(day), ...item })))
    .sort((a, b) => a.day - b.day || releaseTitle(a.media).localeCompare(releaseTitle(b.media))), [events]);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
    setViewDate(next);
    setSelected(1);
  };

  const goToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(today.getDate());
  };

  const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), selected);
  const selectedEvents = events[selected] ?? [];

  return (
    <div className="h-full overflow-y-auto pb-32">
      <div className="px-5 pt-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftMonth(-1)} className="w-10 h-10 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-center">
            <ChevronLeft size={16} className="text-[#111] dark:text-white" />
          </button>
          <div className="text-[#111] dark:text-white" style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4 }}>{month}</div>
          <button onClick={() => shiftMonth(1)} className="w-10 h-10 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-center">
            <ChevronRight size={16} className="text-[#111] dark:text-white" />
          </button>
        </div>
        <button onClick={goToday} className="px-5 py-2.5 rounded-full bg-[#111] text-white dark:bg-white dark:text-black" style={{ fontSize: 12, fontWeight: 800 }}>
          Today
        </button>
      </div>

      <div className="px-5 mt-5">
        <div className="p-4 bg-white/90 dark:bg-[#0F0F10]/92 border border-[#E5E5E5] dark:border-white/10 shadow-[0_20px_60px_-35px_rgba(0,0,0,0.8)]" style={{ borderRadius: 30 }}>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d, i) => <div key={i} className="text-center text-[#666666]" style={{ fontSize: 11, fontWeight: 700 }}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              const isSel = d === selected;
              const ev = d ? events[d] : undefined;
              return (
                <button
                  key={i}
                  disabled={!d}
                  onClick={() => d && setSelected(d)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition ${isSel ? "bg-white text-black shadow-[0_10px_25px_-16px_rgba(255,255,255,0.9)]" : "text-[#111] dark:text-white hover:bg-white/10"} ${!d ? "opacity-0" : ""}`}
                  style={{ fontSize: 13, fontWeight: isSel ? 800 : 600 }}
                >
                  {d}
                  {ev && <div className="absolute bottom-1.5 flex gap-0.5">{ev.slice(0, 4).map((event, idx) => <div key={idx} className={`w-1.5 h-1.5 rounded-full ${event.media.releaseType === "episode" || event.media.releaseType === "anime_episode" ? "bg-white" : "bg-[#D9A441]"}`} />)}</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[#111] dark:text-white" style={{ fontSize: 18, fontWeight: 800 }}>
            {readableDate(selectedDate)}
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[#666666]" style={{ fontSize: 11, fontWeight: 700 }}>
            {selectedEvents.length} release{selectedEvents.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="space-y-3">
          {selectedEvents.map((e) => (
            <div key={`${e.media.id}-${e.title}-${e.media.seasonNumber || ""}-${e.media.episodeNumber || ""}`} className="p-3 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center gap-3" style={{ borderRadius: 24 }}>
              <div className="w-16 h-20 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0">
                <ImageWithFallback src={e.media.poster || e.media.banner || ""} alt={releaseTitle(e.media)} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ReleaseIcon media={e.media} />
                  <div className="text-[#D9A441]" style={{ fontSize: 11, fontWeight: 800 }}>{releaseLabel(e.media)}</div>
                </div>
                <div className="text-[#111] dark:text-white line-clamp-2" style={{ fontSize: 14, fontWeight: 800 }}>{releaseTitle(e.media)}</div>
                <div className="text-[#666666] mt-1 line-clamp-1" style={{ fontSize: 11 }}>{releaseSubtitle(e.media)}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(e.media.genres || []).slice(0, 2).map((genre) => (
                    <span key={genre} className="px-2 py-1 rounded-full bg-[#D9A441]/15 text-[#D9A441]" style={{ fontSize: 10, fontWeight: 700 }}>{genre}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {selectedEvents.length === 0 && (
            <div className="p-8 text-center bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]" style={{ borderRadius: 28 }}>
              <div className="w-14 h-14 rounded-full mx-auto bg-white/10 flex items-center justify-center mb-3">
                <CalendarDays size={20} className="text-[#D9A441]" />
              </div>
              <div className="text-[#111] dark:text-white" style={{ fontSize: 15, fontWeight: 800 }}>No releases on this day</div>
              <div className="text-[#666666] mt-1" style={{ fontSize: 12 }}>Pick another highlighted date or check the full month list below.</div>
            </div>
          )}
        </div>
      </div>

      {allMonthEvents.length > 0 && (
        <div className="px-5 mt-6">
          <div className="text-[#111] dark:text-white mb-3" style={{ fontSize: 18, fontWeight: 800 }}>All releases this month</div>
          <div className="space-y-2">
            {allMonthEvents.map((e) => (
              <button key={`${e.day}-${e.media.id}-${e.media.seasonNumber || ""}-${e.media.episodeNumber || ""}`} onClick={() => setSelected(e.day)} className="w-full p-3 rounded-2xl bg-white/8 border border-white/10 flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-full bg-[#D9A441]/15 text-[#D9A441] flex items-center justify-center" style={{ fontSize: 13, fontWeight: 900 }}>{e.day}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white line-clamp-1" style={{ fontSize: 13, fontWeight: 800 }}>{releaseTitle(e.media)}</div>
                  <div className="text-white/50 line-clamp-1" style={{ fontSize: 11 }}>{releaseLabel(e.media)}{e.media.episodeTitle ? ` • ${e.media.episodeTitle}` : ""}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}