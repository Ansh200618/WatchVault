import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Bookmark, Star, ChevronRight, Play, Bell } from "lucide-react";
import type { Media } from "../../data";

export function FilterChips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1 snap-x snap-mandatory">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`min-h-[40px] px-4 py-2 rounded-full whitespace-nowrap border transition snap-start flex-shrink-0 ${
            value === o
              ? "bg-[#111] text-white border-[#111] dark:bg-white dark:text-black dark:border-white"
              : "bg-white text-[#111] border-[#E5E5E5] dark:bg-[#111111] dark:text-white dark:border-[#2A2A2A]"
          }`}
          style={{ fontSize: 13, fontWeight: 650, lineHeight: 1 }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function SearchBar({
  placeholder = "Search movies, series, anime",
  value,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] rounded-full px-4 py-3 min-h-[54px]">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#666666] flex-shrink-0">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="bg-transparent outline-none flex-1 min-w-0 placeholder:text-[#666666] text-[#111] dark:text-white"
        style={{ fontSize: 14 }}
      />
    </div>
  );
}

export function PosterCard({
  m,
  onClick,
  w = 140,
  fluid = false,
}: {
  m: Media;
  onClick?: () => void;
  w?: number;
  fluid?: boolean;
}) {
  const widthStyle = fluid ? "100%" : w;
  const cardHeightStyle = fluid ? undefined : w * 1.4;

  return (
    <button onClick={onClick} className={`${fluid ? "w-full" : "flex-shrink-0"} min-w-0 text-left`} style={fluid ? undefined : { width: w }}>
      <div
        className="relative w-full aspect-[5/7] overflow-hidden bg-[#E5E5E5] dark:bg-[#2A2A2A] shadow-[0_10px_24px_-12px_rgba(0,0,0,0.35)]"
        style={{ width: widthStyle, height: cardHeightStyle, borderRadius: 24 }}
      >
        <ImageWithFallback src={m.poster} alt={m.title} className="w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent" />
        <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/45 backdrop-blur flex items-center justify-center">
          <Bookmark size={14} className="text-white" />
        </div>
        {m.rating ? (
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-[#D9A441] flex items-center gap-1">
            <Star size={10} className="text-black" fill="black" />
            <span className="text-black" style={{ fontSize: 11, fontWeight: 700 }}>
              {m.rating}
            </span>
          </div>
        ) : (
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-black/55 backdrop-blur">
            <span className="text-white/80" style={{ fontSize: 10 }}>No rating</span>
          </div>
        )}
      </div>
      <div className="mt-2 px-1 min-w-0">
        <div className="text-[#111] dark:text-white line-clamp-1" style={{ fontSize: 14, fontWeight: 600 }}>
          {m.title}
        </div>
        <div className="text-[#666666] dark:text-[#B8B8B8]" style={{ fontSize: 12 }}>
          {m.type} · {m.year}
        </div>
      </div>
    </button>
  );
}

export function ContinueCard({ m, onClick }: { m: Media; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex-shrink-0 text-left" style={{ width: 240 }}>
      <div
        className="relative overflow-hidden bg-[#E5E5E5] dark:bg-[#2A2A2A]"
        style={{ width: 240, height: 130, borderRadius: 24 }}
      >
        <ImageWithFallback src={m.poster} alt={m.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-white line-clamp-1" style={{ fontSize: 14, fontWeight: 600 }}>
            {m.title}
          </div>
          <div className="text-white/80" style={{ fontSize: 11 }}>
            {m.lastEpisode || "Continue"}
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full bg-[#D9A441] rounded-full"
              style={{ width: `${m.progress ?? 30}%` }}
            />
          </div>
        </div>
        <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white flex items-center justify-center">
          <Play size={14} className="text-black ml-0.5" fill="black" />
        </div>
      </div>
    </button>
  );
}

export function UpcomingCard({ m, onClick }: { m: Media; onClick?: () => void }) {
  return (
    <div
      className="flex gap-3 p-3 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]"
      style={{ borderRadius: 24 }}
    >
      <div className="overflow-hidden flex-shrink-0" style={{ width: 70, height: 95, borderRadius: 18 }}>
        <ImageWithFallback src={m.poster} alt={m.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-full bg-[#D9A441]/20 text-[#7A5A1F] dark:text-[#D9A441]"
            style={{ fontSize: 10, fontWeight: 600 }}
          >
            {m.countdown ?? "Soon"}
          </span>
          <span className="text-[#666666] dark:text-[#B8B8B8]" style={{ fontSize: 11 }}>
            {m.releaseDate}
          </span>
        </div>
        <div
          className="mt-1 text-[#111] dark:text-white line-clamp-1"
          style={{ fontSize: 15, fontWeight: 600 }}
        >
          {m.title}
        </div>
        <div className="text-[#666666] dark:text-[#B8B8B8]" style={{ fontSize: 12 }}>
          {m.type} · {m.language}
        </div>
        <button
          onClick={onClick}
          className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#111] text-white dark:bg-white dark:text-black"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          <Bell size={11} /> Remind me
        </button>
      </div>
    </div>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 mt-6 mb-3">
      <div className="text-[#111] dark:text-white" style={{ fontSize: 18, fontWeight: 600 }}>
        {title}
      </div>
      {action && (
        <button onClick={onAction} className="flex items-center gap-1 text-[#666666] dark:text-[#B8B8B8]" style={{ fontSize: 12 }}>
          {action} <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

export function StatusChip({ status }: { status?: string }) {
  if (!status) return null;
  const colors: Record<string, string> = {
    Watching: "bg-[#D9A441]/15 text-[#7A5A1F] dark:text-[#D9A441]",
    Completed: "bg-black/10 text-black dark:bg-white/15 dark:text-white",
    Plan: "bg-[#D9A441]/20 text-[#7A5A1F] dark:text-[#D9A441]",
    Favorite: "bg-[#F3C76A]/30 text-[#7A5A1F] dark:text-[#F3C76A]",
    Dropped: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    "On Hold": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Upcoming: "bg-[#D9A441]/20 text-[#7A5A1F] dark:text-[#D9A441]",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full ${colors[status] || "bg-gray-100 text-gray-700"}`}
      style={{ fontSize: 10, fontWeight: 600 }}
    >
      {status}
    </span>
  );
}