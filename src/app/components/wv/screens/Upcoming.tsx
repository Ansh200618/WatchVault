import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import type { Media, MediaItem, WatchProviderItem } from "../../../data";
import { FilterChips, UpcomingCard } from "../shared";
import { useLiveData } from "../../../services/liveData";
import { LoadingState } from "../states";
import { apiService } from "../../../services/api";

function runtimeMinutes(runtime?: string) {
  if (!runtime) return null;
  const parsed = Number(String(runtime).replace(/\D/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function providerSnapshots(media: Media): WatchProviderItem[] {
  return (media.providers || []).map((name, index) => ({
    id: `${media.id}:provider:${index}`,
    name,
    logoUrl: null,
    type: "subscription",
    region: "IN",
  }));
}

function mediaSnapshot(media: Media): MediaItem {
  const base = {
    id: media.id,
    title: media.title,
    originalTitle: media.originalTitle || null,
    year: media.year || null,
    posterUrl: media.poster || null,
    backdropUrl: media.banner || media.poster || null,
    overview: media.overview || null,
    genres: media.genres || [],
    languages: media.language ? [media.language] : [],
    ratings: media.ratings?.length ? media.ratings : [{ source: "User" as const, value: media.rating || null, scale: 10 as const }],
    providers: providerSnapshots(media),
    trailerUrl: media.trailerUrl || null,
  };

  if (media.type === "Movie") {
    return { ...base, kind: "movie", runtimeMinutes: runtimeMinutes(media.runtime), releaseDate: media.releaseDate || null };
  }

  if (media.type === "Series") {
    const seasons = media.seasonDetails || [];
    return {
      ...base,
      kind: "tv",
      firstAirDate: media.releaseDate || null,
      lastAirDate: null,
      episodeRuntimeMinutes: runtimeMinutes(media.runtime),
      seasonCount: media.seasons || seasons.length || 1,
      episodeCount: media.totalEpisodes || seasons.reduce((sum, season) => sum + (season.episodeCount || 0), 0) || 0,
      status: "Returning",
      seasons: seasons.map((season) => ({
        id: season.id,
        seasonNumber: season.seasonNumber,
        name: season.name,
        episodeCount: season.episodeCount,
        airDate: season.airDate || null,
        posterUrl: season.posterUrl || null,
        watchedCount: season.watchedCount || 0,
      })),
    };
  }

  const seasons = media.seasonDetails?.length ? media.seasonDetails : [{
    id: `${media.id}:season:1`,
    seasonNumber: 1,
    name: "Season 1",
    episodeCount: media.totalEpisodes || 0,
    airDate: media.releaseDate || null,
    posterUrl: media.poster || null,
    watchedCount: media.watched || 0,
  }];

  return {
    ...base,
    kind: "anime",
    format: "TV",
    episodeCount: media.totalEpisodes || seasons.reduce((sum, season) => sum + (season.episodeCount || 0), 0) || null,
    durationMinutes: runtimeMinutes(media.runtime),
    seasons: seasons.map((season) => ({
      id: season.id,
      seasonNumber: season.seasonNumber,
      name: season.name,
      episodeCount: season.episodeCount,
      airDate: season.airDate || null,
      posterUrl: season.posterUrl || null,
      watchedCount: season.watchedCount || 0,
    })),
    studio: null,
    source: "anilist",
  };
}

export function Upcoming({ onOpen }: { onOpen: (m: Media) => void }) {
  const [filter, setFilter] = useState("This Month");
  const [selected, setSelected] = useState<Media | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { upcoming, loading, refresh } = useLiveData();
  const list = useMemo(() => {
    return upcoming.filter((m) => {
      if (filter === "Movies") return m.type === "Movie";
      if (filter === "Series") return m.type === "Series";
      if (filter === "Anime") return m.type === "Anime";
      if (filter === "This Week" && m.releaseDate) {
        const now = Date.now();
        const then = new Date(m.releaseDate).getTime();
        return then >= now && then <= now + 7 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [filter, upcoming]);

  const saveReminder = async (offset: string) => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      await apiService.addLibraryItem({
        mediaId: selected.id,
        status: "plan",
        progressPercent: 0,
        notes: `Reminder: ${offset}`,
        media: mediaSnapshot(selected),
      });
      setMessage(`Reminder saved for ${selected.title}`);
      setSelected(null);
      await refresh();
    } catch {
      setMessage("Could not save reminder right now. Check backend/API status in Settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-28">
      <div className="px-5 pt-14 flex items-center justify-between">
        <div className="text-[#111] dark:text-white" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
          Upcoming
        </div>
        <button onClick={() => setFilter("This Month")} className="w-10 h-10 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-center" aria-label="Show this month">
          <CalendarDays size={14} className="text-[#111] dark:text-white" />
        </button>
      </div>
      <div className="mt-5">
        <FilterChips
          options={["Movies", "Series", "Anime", "This Week", "This Month"]}
          value={filter}
          onChange={setFilter}
        />
      </div>
      {message && (
        <div className="mx-5 mt-4 p-3 rounded-2xl bg-[#D9A441]/15 text-[#7A5A1F] dark:text-[#D9A441]" style={{ fontSize: 12, fontWeight: 600 }}>
          {message}
        </div>
      )}
      <div className="px-5 mt-5 space-y-3">
        {loading && list.length === 0 ? <LoadingState /> : list.map((m) => (
          <button key={m.id} onClick={() => setSelected(m)} className="w-full text-left">
            <UpcomingCard m={m} onClick={() => setSelected(m)} />
          </button>
        ))}
        {!loading && list.length === 0 && (
          <div className="p-6 text-center bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#666666]" style={{ borderRadius: 24, fontSize: 13 }}>
            No upcoming {filter.toLowerCase()} releases found.
          </div>
        )}
      </div>

      {selected && (
        <div className="absolute inset-0 bg-black/40 flex items-end z-30" onClick={() => setSelected(null)}>
          <div className="w-full bg-white dark:bg-[#111111] p-5 pb-8" style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-[#E5E5E5] mx-auto mb-4" />
            <div className="text-[#111] dark:text-white" style={{ fontSize: 18, fontWeight: 700 }}>
              {selected.title}
            </div>
            <div className="text-[#666666] mt-1" style={{ fontSize: 12 }}>
              {selected.releaseDate || "Release date pending"}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => onOpen(selected)} className="p-3 rounded-2xl bg-[#111] text-white dark:bg-white dark:text-black" style={{ fontSize: 13, fontWeight: 700 }}>
                Open Details
              </button>
              {["Release day", "1 day before", "3 days before", "1 week before"].map((o) => (
                <button key={o} disabled={saving} onClick={() => void saveReminder(o)} className="p-3 rounded-2xl border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white disabled:opacity-50" style={{ fontSize: 13, fontWeight: 600 }}>
                  {saving ? "Saving..." : o}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}