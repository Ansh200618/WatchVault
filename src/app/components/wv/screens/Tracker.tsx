import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import type { Media } from "../../../data";
import { StatusChip } from "../shared";
import { apiService } from "../../../services/api";
import { useLiveData } from "../../../services/liveData";

type TrackerTab = "Seasons" | "Episodes" | "Progress";
type Episode = {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string | null;
  airDate: string | null;
  runtimeMinutes: number | null;
  stillUrl: string | null;
};

function keyFor(s: number, e: number) {
  return `${s}-${e}`;
}

function buildEpisodeSlots(media: Media, seasonNumber: number, count: number): Episode[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => ({
    id: `${media.id}:season:${seasonNumber}:episode:${index + 1}`,
    seasonNumber,
    episodeNumber: index + 1,
    title: `Episode ${index + 1}`,
    airDate: null,
    runtimeMinutes: media.runtime ? Number(String(media.runtime).replace(/\D/g, "")) || null : null,
    stillUrl: media.banner || media.poster || null,
  }));
}

export function Tracker({ m, onBack }: { m: Media; onBack: () => void }) {
  const { refresh } = useLiveData();
  const seasons = useMemo(() => {
    if (m.seasonDetails?.length) return m.seasonDetails;
    const seasonCount = Math.max(1, m.seasons ?? 1);
    const total = Math.max(1, m.totalEpisodes || 8);
    return Array.from({ length: seasonCount }, (_, index) => ({
      id: `${m.id}:season:${index + 1}`,
      seasonNumber: index + 1,
      name: `Season ${index + 1}`,
      episodeCount: Math.max(1, Math.ceil(total / seasonCount)),
      watchedCount: 0,
      posterUrl: m.poster,
      airDate: m.releaseDate,
    }));
  }, [m]);

  const [tab, setTab] = useState<TrackerTab>("Seasons");
  const [seasonNumber, setSeasonNumber] = useState(seasons[0]?.seasonNumber || 1);
  const [watched, setWatched] = useState<Record<string, boolean>>({});
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [episodeSource, setEpisodeSource] = useState<"provider" | "slots">("slots");
  const [dialog, setDialog] = useState<{ s: number; e: number } | null>(null);

  const selectedSeason = seasons.find((season) => season.seasonNumber === seasonNumber) || seasons[0];
  const expectedEpisodeCount = selectedSeason?.episodeCount || Math.max(1, Math.ceil((m.totalEpisodes || 8) / (m.seasons || 1)));
  const episodeCount = selectedSeason?.episodeCount || episodes.length || expectedEpisodeCount;
  const totalEpisodes = seasons.reduce((sum, season) => sum + (season.episodeCount || 0), 0) || m.totalEpisodes || episodeCount;
  const completed = Object.values(watched).filter(Boolean).length;
  const progress = totalEpisodes ? Math.round((completed / totalEpisodes) * 100) : (m.progress ?? 0);

  useEffect(() => {
    const initialWatched = Math.floor(((m.progress || 0) / 100) * (totalEpisodes || 0));
    if (!initialWatched) return;

    const next: Record<string, boolean> = {};
    let remaining = initialWatched;
    for (const season of seasons) {
      for (let i = 1; i <= (season.episodeCount || 0) && remaining > 0; i += 1) {
        next[keyFor(season.seasonNumber, i)] = true;
        remaining -= 1;
      }
    }
    setWatched(next);
  }, [m.id, m.progress, seasons, totalEpisodes]);

  useEffect(() => {
    let cancelled = false;
    setLoadingEpisodes(true);

    apiService.getSeasonEpisodes(m.id, seasonNumber)
      .then((season) => {
        if (cancelled) return;
        const providerEpisodes = season.episodes || [];
        if (providerEpisodes.length) {
          setEpisodes(providerEpisodes);
          setEpisodeSource("provider");
        } else {
          setEpisodes(buildEpisodeSlots(m, seasonNumber, expectedEpisodeCount));
          setEpisodeSource("slots");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEpisodes(buildEpisodeSlots(m, seasonNumber, expectedEpisodeCount));
          setEpisodeSource("slots");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingEpisodes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [m, seasonNumber, expectedEpisodeCount]);

  const isEpisodeWatched = (s: number, e: number) => Boolean(watched[keyFor(s, e)]);

  const latestEpisodeFromWatched = (state: Record<string, boolean>) => {
    let latest: { season: number; episode: number } | null = null;
    for (const key of Object.keys(state)) {
      if (!state[key]) continue;
      const [season, episode] = key.split("-").map(Number);
      if (!latest || season > latest.season || (season === latest.season && episode > latest.episode)) {
        latest = { season, episode };
      }
    }
    return latest;
  };

  const persistProgress = async (state: Record<string, boolean>) => {
    const count = Object.values(state).filter(Boolean).length;
    const nextProgress = totalEpisodes ? Math.round((count / totalEpisodes) * 100) : 0;
    const payload = {
      status: nextProgress >= 100 ? "completed" as const : nextProgress > 0 ? "watching" as const : "plan" as const,
      progressPercent: nextProgress,
      lastEpisode: latestEpisodeFromWatched(state),
    };

    try {
      await apiService.updateLibraryItem(m.id, payload);
    } catch {
      await apiService.addLibraryItem({ mediaId: m.id, ...payload });
    }
    await refresh();
  };

  const applyWatched = (producer: (current: Record<string, boolean>) => Record<string, boolean>) => {
    setWatched((current) => {
      const next = producer(current);
      void persistProgress(next);
      return next;
    });
  };

  const toggle = (s: number, e: number) => {
    const key = keyFor(s, e);
    if (!watched[key] && e > 1) {
      setDialog({ s, e });
      return;
    }

    applyWatched((current) => ({ ...current, [key]: !current[key] }));
  };

  const confirmPrev = (yes: boolean) => {
    if (!dialog) return;
    const { s, e } = dialog;
    applyWatched((current) => {
      const next = { ...current };
      if (yes) {
        for (let i = 1; i <= e; i += 1) next[keyFor(s, i)] = true;
      } else {
        next[keyFor(s, e)] = true;
      }
      return next;
    });
    setDialog(null);
  };

  const markSeasonWatched = (s: number, count: number) => {
    applyWatched((current) => {
      const next = { ...current };
      for (let i = 1; i <= count; i += 1) next[keyFor(s, i)] = true;
      return next;
    });
  };

  const markAllWatched = () => {
    applyWatched(() => {
      const next: Record<string, boolean> = {};
      seasons.forEach((season) => {
        for (let i = 1; i <= (season.episodeCount || 0); i += 1) next[keyFor(season.seasonNumber, i)] = true;
      });
      return next;
    });
  };

  const resetProgress = () => applyWatched(() => ({}));

  const renderEpisodes = () => (
    <div className="space-y-2">
      {loadingEpisodes && (
        <div className="p-4 rounded-3xl bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#666666]" style={{ fontSize: 12 }}>
          Loading latest episode list from provider...
        </div>
      )}
      {!loadingEpisodes && episodeSource === "slots" && episodes.length > 0 && (
        <div className="p-4 rounded-3xl bg-[#D9A441]/15 border border-[#D9A441]/25 text-[#7A5A1F] dark:text-[#D9A441]" style={{ fontSize: 12, lineHeight: 1.5 }}>
          Provider episode titles are not available yet. Showing trackable episode slots from the season episode count.
        </div>
      )}
      {episodes.map((episode) => {
        const w = isEpisodeWatched(episode.seasonNumber, episode.episodeNumber);
        return (
          <div key={episode.id} className="flex items-center gap-3 p-2 rounded-2xl bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]">
            <div className="w-16 h-11 rounded-xl overflow-hidden bg-[#E5E5E5] flex-shrink-0">
              <ImageWithFallback src={episode.stillUrl || m.banner || m.poster} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[#111] dark:text-white line-clamp-1" style={{ fontSize: 12, fontWeight: 600 }}>
                S{episode.seasonNumber} E{episode.episodeNumber} - {episode.title || `Episode ${episode.episodeNumber}`}
              </div>
              <div className="text-[#666666]" style={{ fontSize: 10 }}>
                {[episode.airDate, episode.runtimeMinutes ? `${episode.runtimeMinutes}m` : null].filter(Boolean).join(" - ") || "Track progress"}
              </div>
            </div>
            <button
              onClick={() => toggle(episode.seasonNumber, episode.episodeNumber)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center border-2 ${w ? "bg-[#D9A441] border-[#D9A441]" : "border-[#E5E5E5] dark:border-[#2A2A2A]"}`}
              aria-label={w ? "Mark episode unwatched" : "Mark episode watched"}
            >
              {w && <Check size={15} className="text-white" />}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto pb-32">
      <div className="px-5 pt-12 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-center">
          <ArrowLeft size={16} className="text-[#111] dark:text-white" />
        </button>
        <div className="flex-1">
          <div className="text-[#111] dark:text-white" style={{ fontSize: 18, fontWeight: 700 }}>
            {m.title}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusChip status={m.status} />
            <span className="text-[#666666]" style={{ fontSize: 11 }}>
              {progress}% complete
            </span>
          </div>
        </div>
        <div className="w-12 h-16 rounded-2xl overflow-hidden">
          <ImageWithFallback src={m.poster} alt="" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="px-5 mt-5 flex gap-2">
        {(["Seasons", "Episodes", "Progress"] as TrackerTab[]).map((option) => (
          <button
            key={option}
            onClick={() => setTab(option)}
            className={`px-4 py-2 rounded-full ${tab === option ? "bg-[#111] text-white dark:bg-white dark:text-black" : "bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white"}`}
            style={{ fontSize: 12, fontWeight: 600 }}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="px-5 mt-5">
        {tab === "Seasons" && (
          <div className="space-y-3">
            {seasons.map((season) => {
              const count = season.episodeCount || 0;
              const seasonCompleted = Array.from({ length: count }, (_, index) => keyFor(season.seasonNumber, index + 1)).filter((key) => watched[key]).length;
              const pct = count ? Math.round((seasonCompleted / count) * 100) : 0;
              return (
                <button
                  key={season.id}
                  onClick={() => {
                    setSeasonNumber(season.seasonNumber);
                    setTab("Episodes");
                  }}
                  className="w-full p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center gap-3 text-left"
                  style={{ borderRadius: 24 }}
                >
                  <div className="w-14 h-16 rounded-2xl overflow-hidden bg-[#E5E5E5] flex-shrink-0">
                    <ImageWithFallback src={season.posterUrl || m.poster} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#111] dark:text-white" style={{ fontSize: 15, fontWeight: 600 }}>
                      {season.name}
                    </div>
                    <div className="text-[#666666]" style={{ fontSize: 11 }}>
                      {count} episodes - {pct}% watched
                    </div>
                    <div className="mt-2 h-1.5 bg-[#E5E5E5] dark:bg-[#2A2A2A] rounded-full overflow-hidden">
                      <div className="h-full bg-[#D9A441]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[#666666]" />
                </button>
              );
            })}
          </div>
        )}

        {tab === "Episodes" && (
          <div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
              {seasons.map((season) => (
                <button
                  key={season.id}
                  onClick={() => setSeasonNumber(season.seasonNumber)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap ${seasonNumber === season.seasonNumber ? "bg-[#111] text-white dark:bg-white dark:text-black" : "bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white"}`}
                  style={{ fontSize: 12, fontWeight: 600 }}
                >
                  {season.name}
                </button>
              ))}
            </div>
            {renderEpisodes()}
            <button
              onClick={() => markSeasonWatched(seasonNumber, episodeCount)}
              className="w-full mt-3 py-3 rounded-full bg-[#111] text-white dark:bg-white dark:text-black"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              Mark Season Watched
            </button>
          </div>
        )}

        {tab === "Progress" && (
          <div className="p-5 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]" style={{ borderRadius: 28 }}>
            <div className="text-[#111] dark:text-white" style={{ fontSize: 26, fontWeight: 700 }}>{progress}%</div>
            <div className="text-[#666666]" style={{ fontSize: 12 }}>{completed} of {totalEpisodes} episodes watched</div>
            <div className="mt-4 h-2 bg-[#E5E5E5] dark:bg-[#2A2A2A] rounded-full overflow-hidden">
              <div className="h-full bg-[#D9A441]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="absolute left-5 right-5 bottom-24 flex gap-2">
        <button onClick={markAllWatched} className="flex-1 py-3 rounded-full bg-[#111] text-white dark:bg-white dark:text-black" style={{ fontSize: 12, fontWeight: 600 }}>
          Mark All Watched
        </button>
        <button onClick={resetProgress} className="flex-1 py-3 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white" style={{ fontSize: 12, fontWeight: 600 }}>
          Reset Progress
        </button>
      </div>

      {dialog && (
        <div className="absolute inset-0 bg-black/40 flex items-end z-30" onClick={() => setDialog(null)}>
          <div className="w-full bg-white dark:bg-[#111111] p-5 pb-8" style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-[#E5E5E5] mx-auto mb-4" />
            <div className="text-[#111] dark:text-white text-center" style={{ fontSize: 16, fontWeight: 600 }}>
              Mark previous episodes as watched too?
            </div>
            <div className="text-[#666666] text-center mt-1" style={{ fontSize: 12 }}>
              S{dialog.s} E1 - E{dialog.e}
            </div>
            <div className="mt-5 space-y-2">
              <button onClick={() => confirmPrev(true)} className="w-full py-3 rounded-full bg-[#111] text-white dark:bg-white dark:text-black" style={{ fontSize: 13, fontWeight: 600 }}>
                Yes, mark previous
              </button>
              <button onClick={() => confirmPrev(false)} className="w-full py-3 rounded-full border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white" style={{ fontSize: 13, fontWeight: 600 }}>
                No, only this episode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
