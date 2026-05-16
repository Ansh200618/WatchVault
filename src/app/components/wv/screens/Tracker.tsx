import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Loader2 } from "lucide-react";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import type { Media } from "../../../data";
import { StatusChip } from "../shared";
import { apiService } from "../../../services/api";
import { useLiveData } from "../../../services/liveData";

type TrackerTab = "Seasons" | "Episodes" | "Progress";
type WatchedMap = Record<string, boolean>;
type Episode = {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string | null;
  airDate: string | null;
  runtimeMinutes: number | null;
  stillUrl: string | null;
};

type TrackerProps = {
  m: Media;
  onBack: () => void;
  onProgressChange?: (patch: Partial<Media>) => void;
};

function keyFor(s: number, e: number) {
  return `${s}-${e}`;
}

function watchedMapFromMedia(media: Media): WatchedMap | null {
  const raw = (media as any).watchedEpisodes;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return Object.fromEntries(Object.entries(raw).filter(([, value]) => Boolean(value))) as WatchedMap;
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

export function Tracker({ m, onBack, onProgressChange }: TrackerProps) {
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
  const [watched, setWatched] = useState<WatchedMap>({});
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [episodeSource, setEpisodeSource] = useState<"provider" | "slots">("slots");
  const [dialog, setDialog] = useState<{ s: number; e: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const selectedSeason = seasons.find((season) => season.seasonNumber === seasonNumber) || seasons[0];
  const expectedEpisodeCount = selectedSeason?.episodeCount || Math.max(1, Math.ceil((m.totalEpisodes || 8) / (m.seasons || 1)));
  const episodeCount = selectedSeason?.episodeCount || episodes.length || expectedEpisodeCount;
  const totalEpisodes = seasons.reduce((sum, season) => sum + (season.episodeCount || 0), 0) || m.totalEpisodes || episodeCount;
  const completed = Object.values(watched).filter(Boolean).length;
  const progress = totalEpisodes ? Math.round((completed / totalEpisodes) * 100) : (m.progress ?? 0);

  useEffect(() => {
    const exactWatched = watchedMapFromMedia(m);
    if (exactWatched) {
      setWatched(exactWatched);
      return;
    }

    const initialWatched = Math.floor(((m.progress || 0) / 100) * (totalEpisodes || 0));
    if (!initialWatched) {
      setWatched({});
      return;
    }

    const next: WatchedMap = {};
    let remaining = initialWatched;
    for (const season of seasons) {
      for (let i = 1; i <= (season.episodeCount || 0) && remaining > 0; i += 1) {
        next[keyFor(season.seasonNumber, i)] = true;
        remaining -= 1;
      }
    }
    setWatched(next);
  }, [m.id, (m as any).watchedEpisodes, m.progress, seasons, totalEpisodes]);

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

  const latestEpisodeFromWatched = (state: WatchedMap) => {
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

  const normalizeWatched = (state: WatchedMap): WatchedMap =>
    Object.fromEntries(Object.entries(state).filter(([, value]) => Boolean(value))) as WatchedMap;

  const syncSelectedProgress = (state: WatchedMap) => {
    const exactWatched = normalizeWatched(state);
    const count = Object.values(exactWatched).filter(Boolean).length;
    const nextProgress = totalEpisodes ? Math.round((count / totalEpisodes) * 100) : 0;
    const latest = latestEpisodeFromWatched(exactWatched);
    onProgressChange?.({
      progress: nextProgress,
      status: nextProgress >= 100 ? "Completed" : nextProgress > 0 ? "Watching" : "Plan",
      lastEpisode: latest ? `S${latest.season} E${latest.episode}` : undefined,
      watchedEpisodes: exactWatched as any,
    } as Partial<Media>);
    return { exactWatched, nextProgress, latest };
  };

  const persistProgress = async (state: WatchedMap) => {
    const { exactWatched, nextProgress, latest } = syncSelectedProgress(state);
    const payload = {
      status: nextProgress >= 100 ? "completed" as const : nextProgress > 0 ? "watching" as const : "plan" as const,
      progressPercent: nextProgress,
      lastEpisode: latest,
      watchedEpisodes: exactWatched,
    };

    setSaving(true);
    setSaveMessage("Saving progress...");
    try {
      try {
        await apiService.updateLibraryItem(m.id, payload);
      } catch {
        await apiService.addLibraryItem({ mediaId: m.id, ...payload });
        await apiService.updateLibraryItem(m.id, payload);
      }
      setSaveMessage("Progress updated");
      await refresh();
      window.setTimeout(() => setSaveMessage(null), 1600);
    } catch {
      setSaveMessage("Could not save progress. Try again.");
      window.setTimeout(() => setSaveMessage(null), 2200);
    } finally {
      setSaving(false);
    }
  };

  const applyWatched = (producer: (current: WatchedMap) => WatchedMap) => {
    setWatched((current) => {
      const next = normalizeWatched(producer(current));
      syncSelectedProgress(next);
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
      const next: WatchedMap = {};
      seasons.forEach((season) => {
        for (let i = 1; i <= (season.episodeCount || 0); i += 1) next[keyFor(season.seasonNumber, i)] = true;
      });
      return next;
    });
  };

  const resetProgress = () => applyWatched(() => ({}));

  const renderEpisodes = () => (
    <div className="space-y-3">
      {loadingEpisodes && (
        <div className="p-4 rounded-3xl bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#666666]" style={{ fontSize: 12 }}>
          Loading latest episode list...
        </div>
      )}
      {!loadingEpisodes && episodeSource === "slots" && episodes.length > 0 && (
        <div className="p-4 rounded-3xl bg-[#D9A441]/15 border border-[#D9A441]/25 text-[#7A5A1F] dark:text-[#D9A441]" style={{ fontSize: 12, lineHeight: 1.5 }}>
          Episode titles are not available yet. Showing trackable episode slots from the season count.
        </div>
      )}
      {episodes.map((episode) => {
        const w = isEpisodeWatched(episode.seasonNumber, episode.episodeNumber);
        return (
          <div key={episode.id} className="flex items-center gap-3 p-3 rounded-3xl bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]">
            <div className="w-20 h-14 rounded-2xl overflow-hidden bg-[#E5E5E5] flex-shrink-0">
              <ImageWithFallback src={episode.stillUrl || m.banner || m.poster} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[#111] dark:text-white line-clamp-2" style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.25 }}>
                S{episode.seasonNumber} E{episode.episodeNumber} - {episode.title || `Episode ${episode.episodeNumber}`}
              </div>
              <div className="text-[#666666] mt-1" style={{ fontSize: 11 }}>
                {[episode.airDate, episode.runtimeMinutes ? `${episode.runtimeMinutes}m` : null].filter(Boolean).join(" - ") || "Track progress"}
              </div>
            </div>
            <button
              onClick={() => toggle(episode.seasonNumber, episode.episodeNumber)}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 flex-shrink-0 transition ${w ? "bg-[#D9A441] border-[#D9A441]" : "border-[#E5E5E5] dark:border-[#2A2A2A] bg-transparent"}`}
              aria-label={w ? "Mark episode unwatched" : "Mark episode watched"}
            >
              {w && <Check size={18} className="text-white" />}
            </button>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto pb-48">
      <div className="px-5 pt-12 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-center">
          <ArrowLeft size={16} className="text-[#111] dark:text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[#111] dark:text-white truncate" style={{ fontSize: 18, fontWeight: 700 }}>
            {m.title}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusChip status={progress >= 100 ? "Completed" : progress > 0 ? "Watching" : m.status} />
            <span className="text-[#666666]" style={{ fontSize: 11 }}>
              {progress}% complete
            </span>
          </div>
        </div>
        <div className="w-12 h-16 rounded-2xl overflow-hidden flex-shrink-0">
          <ImageWithFallback src={m.poster} alt="" className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="px-5 mt-5 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {(["Seasons", "Episodes", "Progress"] as TrackerTab[]).map((option) => (
          <button
            key={option}
            onClick={() => setTab(option)}
            className={`px-5 py-3 rounded-full whitespace-nowrap ${tab === option ? "bg-[#111] text-white dark:bg-white dark:text-black" : "bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white"}`}
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            {option}
          </button>
        ))}
      </div>

      {saveMessage && (
        <div className="mx-5 mt-3 px-4 py-2.5 rounded-2xl bg-[#D9A441]/18 border border-[#D9A441]/30 text-[#D9A441] flex items-center gap-2" style={{ fontSize: 12, fontWeight: 700 }}>
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saveMessage}
        </div>
      )}

      <div className="px-5 mt-5">
        {tab === "Seasons" && (
          <div className="space-y-3 pb-5">
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
                  className="w-full p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center gap-4 text-left"
                  style={{ borderRadius: 28 }}
                >
                  <div className="w-16 h-20 rounded-3xl overflow-hidden bg-[#E5E5E5] flex-shrink-0">
                    <ImageWithFallback src={season.posterUrl || m.poster} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#111] dark:text-white line-clamp-1" style={{ fontSize: 17, fontWeight: 800 }}>
                      {season.name}
                    </div>
                    <div className="text-[#666666] mt-1" style={{ fontSize: 12 }}>
                      {count} episodes - {pct}% watched
                    </div>
                    <div className="mt-3 h-2 bg-[#E5E5E5] dark:bg-[#2A2A2A] rounded-full overflow-hidden">
                      <div className="h-full bg-[#D9A441] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-[#666666] flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {tab === "Episodes" && (
          <div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
              {seasons.map((season) => (
                <button
                  key={season.id}
                  onClick={() => setSeasonNumber(season.seasonNumber)}
                  className={`px-5 py-3 rounded-full whitespace-nowrap ${seasonNumber === season.seasonNumber ? "bg-[#111] text-white dark:bg-white dark:text-black" : "bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white"}`}
                  style={{ fontSize: 13, fontWeight: 700 }}
                >
                  {season.name}
                </button>
              ))}
            </div>
            {renderEpisodes()}
            <button
              onClick={() => markSeasonWatched(seasonNumber, episodeCount)}
              className="w-full mt-4 py-3 rounded-full bg-[#111] text-white dark:bg-white dark:text-black"
              style={{ fontSize: 13, fontWeight: 700 }}
            >
              Mark Season Watched
            </button>
          </div>
        )}

        {tab === "Progress" && (
          <div className="p-5 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]" style={{ borderRadius: 28 }}>
            <div className="text-[#111] dark:text-white" style={{ fontSize: 30, fontWeight: 900 }}>{progress}%</div>
            <div className="text-[#666666]" style={{ fontSize: 13 }}>{completed} of {totalEpisodes} episodes watched</div>
            <div className="mt-4 h-3 bg-[#E5E5E5] dark:bg-[#2A2A2A] rounded-full overflow-hidden">
              <div className="h-full bg-[#D9A441] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="fixed left-5 right-5 bottom-6 z-40 flex gap-2 pointer-events-auto" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <button onClick={markAllWatched} className="flex-1 py-3.5 rounded-full bg-white text-black shadow-[0_16px_40px_-24px_rgba(255,255,255,0.75)]" style={{ fontSize: 13, fontWeight: 800 }}>
          Mark All Watched
        </button>
        <button onClick={resetProgress} className="flex-1 py-3.5 rounded-full bg-[#111111]/95 border border-white/15 text-white shadow-[0_16px_40px_-24px_rgba(0,0,0,0.8)]" style={{ fontSize: 13, fontWeight: 800 }}>
          Reset Progress
        </button>
      </div>

      {dialog && (
        <div className="absolute inset-0 bg-black/40 flex items-end z-50" onClick={() => setDialog(null)}>
          <div className="w-full bg-white dark:bg-[#111111] p-5 pb-8" style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }} onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-[#E5E5E5] mx-auto mb-4" />
            <div className="text-[#111] dark:text-white text-center" style={{ fontSize: 16, fontWeight: 700 }}>
              Mark previous episodes as watched too?
            </div>
            <div className="text-[#666666] text-center mt-1" style={{ fontSize: 12 }}>
              S{dialog.s} E1 - E{dialog.e}
            </div>
            <div className="mt-5 space-y-2">
              <button onClick={() => confirmPrev(true)} className="w-full py-3 rounded-full bg-[#111] text-white dark:bg-white dark:text-black" style={{ fontSize: 13, fontWeight: 700 }}>
                Yes, mark previous
              </button>
              <button onClick={() => confirmPrev(false)} className="w-full py-3 rounded-full border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white" style={{ fontSize: 13, fontWeight: 700 }}>
                No, only this episode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
