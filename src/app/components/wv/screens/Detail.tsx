import { useState } from "react";
import { ArrowLeft, Bell, Check, Heart, Play, Plus } from "lucide-react";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import type { Media } from "../../../data";
import { StatusChip } from "../shared";
import { useSetArtwork } from "../artwork";
import { GlassPanel, GlassButton, GlassRatingChip, FloatingCircle } from "../glass";
import { apiService } from "../../../services/api";
import { useLiveData } from "../../../services/liveData";

export function Detail({
  m,
  onBack,
  onOpenTracker,
}: {
  m: Media;
  onBack: () => void;
  onOpenTracker: () => void;
}) {
  useSetArtwork(m.banner || m.poster);
  const { refresh } = useLiveData();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Ratings shape mirrors RatingItem[] from data.ts. In the real app these come
  // from TMDB (TMDB), OMDb (IMDb / RT / Metacritic), and the user's own score.
  const liveRatings = m.ratings?.map((rating) => ({
    label:
      rating.source === "RottenTomatoes"
        ? "RT"
        : rating.source === "Metacritic"
          ? "Meta"
          : rating.source,
    value: rating.value,
    suffix: rating.scale === 100 ? "%" : undefined,
  })) ?? [];
  const ratings: { label: string; value: number | null; suffix?: string }[] =
    liveRatings.length > 0
      ? liveRatings.slice(0, 5)
      : [
          { label: "TMDB", value: m.rating || null },
          { label: "IMDb", value: null },
          { label: "RT", value: null, suffix: "%" },
          { label: "Meta", value: null, suffix: "" },
          { label: "User", value: null },
        ];
  const saveStatus = async (status: "watching" | "plan" | "completed" | "favorite") => {
    await apiService.addLibraryItem({
      mediaId: m.id,
      status,
      progressPercent: status === "completed" ? 100 : status === "watching" ? (m.progress ?? 0) : 0,
    });
    setLibraryOpen(false);
    setMessage(status === "plan" ? "Added to pending list" : status === "completed" ? "Marked as watched" : "Saved to library");
    await refresh();
  };

  const openTrailer = () => {
    if (m.trailerUrl) {
      window.open(m.trailerUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setMessage("Trailer is not available for this title");
  };

  const remind = async () => {
    await apiService.addLibraryItem({ mediaId: m.id, status: "plan", progressPercent: 0, notes: "Reminder enabled" });
    setMessage("Reminder saved in your pending list");
    await refresh();
  };

  return (
    <div className="h-full overflow-y-auto pb-28">
      <div className="relative" style={{ height: 340 }}>
        <ImageWithFallback src={m.banner || m.poster} alt={m.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
        <div className="absolute top-12 left-5">
          <FloatingCircle onClick={onBack}><ArrowLeft size={18} /></FloatingCircle>
        </div>
        <div className="absolute top-12 right-5">
          <FloatingCircle onClick={() => void saveStatus("favorite")}><Heart size={18} /></FloatingCircle>
        </div>
      </div>

      <div
        className="relative -mt-12 px-5 pt-6"
        style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
      >
        <div className="flex items-start gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-full bg-[#111] text-white dark:bg-white dark:text-black" style={{ fontSize: 10, fontWeight: 700 }}>
            {m.type}
          </span>
          <StatusChip status={m.status} />
        </div>
        <div className="mt-3 text-white" style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
          {m.title}
        </div>
        {m.originalTitle && m.originalTitle !== m.title && (
          <div className="text-white/70" style={{ fontSize: 13 }}>
            {m.originalTitle}
          </div>
        )}
        <div className="mt-1 text-white/60" style={{ fontSize: 12 }}>
          {[m.year || null, m.runtime, m.language].filter(Boolean).join(" - ") || "Details unavailable"}
        </div>

        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {ratings.map((r) => (
            <GlassRatingChip key={r.label} value={r.value} source={r.label} />
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <GlassButton variant="accent" className="flex-1" onClick={() => setLibraryOpen((open) => !open)}>
            <Plus size={14} /> Add to Library
          </GlassButton>
          <GlassButton variant="ghost" onClick={openTrailer}>
            <Play size={13} fill="currentColor" /> Trailer
          </GlassButton>
          {m.status === "Upcoming" && (
            <FloatingCircle onClick={remind}><Bell size={16} /></FloatingCircle>
          )}
        </div>

        {libraryOpen && (
          <GlassPanel className="mt-3 p-3 grid grid-cols-2 gap-2">
            {[
              { label: "Watching", status: "watching" as const },
              { label: "Pending", status: "plan" as const },
              { label: "Watched", status: "completed" as const },
              { label: "Favorite", status: "favorite" as const },
            ].map((option) => (
              <button
                key={option.status}
                onClick={() => void saveStatus(option.status)}
                className="px-3 py-2 rounded-2xl bg-white/10 text-white flex items-center justify-center gap-2"
                style={{ fontSize: 12, fontWeight: 700 }}
              >
                <Check size={13} /> {option.label}
              </button>
            ))}
          </GlassPanel>
        )}

        {message && (
          <div className="mt-3 px-4 py-2 rounded-2xl bg-[#D9A441]/20 text-[#F0C97A]" style={{ fontSize: 12, fontWeight: 600 }}>
            {message}
          </div>
        )}

        {m.type !== "Movie" && (
          <GlassPanel className="mt-4 w-full p-4 flex items-center justify-between" onClick={onOpenTracker}>
            <div className="text-left">
              <div className="text-white" style={{ fontSize: 13, fontWeight: 600 }}>
                {m.progress ?? 0}% - {m.lastEpisode || "Not started"}
              </div>
              <div className="text-white/60" style={{ fontSize: 11 }}>
                Open Episode Tracker
              </div>
              <div className="mt-2 w-48 h-1.5 bg-white/15 rounded-full overflow-hidden">
                <div className="h-full bg-[#D9A441]" style={{ width: `${m.progress ?? 0}%`, boxShadow: "0 0 12px rgba(217,164,65,0.7)" }} />
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
              <Play size={14} className="text-black ml-0.5" fill="currentColor" />
            </div>
          </GlassPanel>
        )}

        <GlassPanel className="mt-5 p-4">
          <div className="text-white mb-2" style={{ fontSize: 16, fontWeight: 600 }}>Overview</div>
          <p className="text-white/70" style={{ fontSize: 13, lineHeight: 1.6 }}>{m.overview}</p>
        </GlassPanel>

        <div className="mt-5">
          <div className="text-white mb-2" style={{ fontSize: 16, fontWeight: 600 }}>Genres</div>
          <div className="flex flex-wrap gap-2">
            {m.genres.map((g) => (
              <span
                key={g}
                className="px-3 py-1.5 rounded-full text-white"
                style={{ fontSize: 12, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.16)" }}
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        {m.providers && m.providers.length > 0 && (
          <div className="mt-5">
            <div className="text-white mb-2" style={{ fontSize: 16, fontWeight: 600 }}>Where to Watch</div>
            <div className="flex gap-2 flex-wrap">
              {m.providers.map((p) => (
                <div
                  key={p}
                  className="px-4 py-2 rounded-2xl text-white"
                  style={{ fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.08)", backdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.16)" }}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        )}

        {(!m.providers || m.providers.length === 0) && (
          <GlassPanel className="mt-5 p-4">
            <div className="text-white mb-1" style={{ fontSize: 16, fontWeight: 600 }}>Where to Watch</div>
            <div className="text-white/65" style={{ fontSize: 12 }}>No streaming providers found for your region yet.</div>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
