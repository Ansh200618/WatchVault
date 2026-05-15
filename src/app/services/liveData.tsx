import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  ApiStatusItem,
  LibraryStatus,
  Media,
  MediaItem,
  UserLibraryItem,
  WatchStatsItem,
} from "../data";
import { apiService, apiStatusToCards, mediaItemToMedia } from "./api";

type Insight = { icon: string; text: string; action: string; mediaId?: string };

type LiveDataState = {
  media: Media[];
  upcoming: Media[];
  insights: Insight[];
  apiStatus: ApiStatusItem[];
  stats: WatchStatsItem;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  searchMedia: (query: string, kind?: "movie" | "tv" | "anime") => Promise<Media[]>;
};

const emptyStats: WatchStatsItem = {
  moviesWatched: 0,
  episodesWatched: 0,
  animeCompleted: 0,
  watchHours: 0,
  pendingTitles: 0,
  completionRatePercent: 0,
  favoriteGenre: null,
  favoriteLanguage: null,
  monthlyHours: [],
  genreDistribution: [],
};

const LiveDataContext = createContext<LiveDataState | null>(null);

function statusLabel(status: LibraryStatus | undefined): Media["status"] {
  const map: Record<LibraryStatus, Media["status"]> = {
    watching: "Watching",
    plan: "Plan",
    completed: "Completed",
    dropped: "Dropped",
    on_hold: "On Hold",
    favorite: "Completed",
  };
  return status ? map[status] : undefined;
}

function withLibrary(media: Media[], library: UserLibraryItem[]) {
  const byId = new Map(library.map((item) => [item.mediaId, item]));

  return media.map((item) => {
    const tracked = byId.get(item.id);
    if (!tracked) return item;

    return {
      ...item,
      status: statusLabel(tracked.status),
      progress: tracked.progressPercent,
      lastEpisode: tracked.lastEpisode ? `S${tracked.lastEpisode.season} E${tracked.lastEpisode.episode}` : item.lastEpisode,
    };
  });
}

function uniqueById(items: Media[]) {
  return Array.from(new Map(items.filter((item) => item.id).map((item) => [item.id, item])).values());
}

function mediaFromLibraryItem(item: UserLibraryItem): Media | null {
  return item.media ? mediaItemToMedia(item.media as MediaItem) : null;
}

async function readJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Failed to fetch ${path}`);
  return response.json();
}

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const [media, setMedia] = useState<Media[]>([]);
  const [upcoming, setUpcoming] = useState<Media[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatusItem[]>([]);
  const [stats, setStats] = useState<WatchStatsItem>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [popularResult, libraryResult, upcomingResult, statusResult, statsResult, insightsResult] = await Promise.allSettled([
        apiService.getPopularMedia(),
        apiService.getUserLibrary(),
        readJson<MediaItem[]>("/api/upcoming"),
        readJson<{ apis: Record<string, string> }>("/api/status"),
        apiService.getStats(),
        readJson<Insight[]>("/api/brain/insights"),
      ]);

      const popular = popularResult.status === "fulfilled" ? popularResult.value.map(mediaItemToMedia) : [];
      const library = libraryResult.status === "fulfilled" ? libraryResult.value : [];
      const libraryMedia = library.map(mediaFromLibraryItem).filter((item): item is Media => Boolean(item));
      const upcomingMedia =
        upcomingResult.status === "fulfilled"
          ? upcomingResult.value.map((item) => ({ ...mediaItemToMedia(item), status: "Upcoming" as const }))
          : [];

      setUpcoming(upcomingMedia);
      setMedia(uniqueById(withLibrary([...libraryMedia, ...popular, ...upcomingMedia], library)));
      setApiStatus(statusResult.status === "fulfilled" ? apiStatusToCards(statusResult.value.apis || {}) : []);
      setStats(statsResult.status === "fulfilled" ? statsResult.value : emptyStats);
      setInsights(insightsResult.status === "fulfilled" ? insightsResult.value : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load live data");
      setMedia([]);
      setUpcoming([]);
      setInsights([]);
      setApiStatus([]);
      setStats(emptyStats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const searchMedia = useCallback(async (query: string, kind?: "movie" | "tv" | "anime") => {
    if (!query.trim()) return media;
    const results = await apiService.searchMedia(query, kind);
    return results.map(mediaItemToMedia);
  }, [media]);

  const value = useMemo(
    () => ({ media, upcoming, insights, apiStatus, stats, loading, error, refresh, searchMedia }),
    [apiStatus, error, insights, loading, media, refresh, searchMedia, stats, upcoming]
  );

  return <LiveDataContext.Provider value={value}>{children}</LiveDataContext.Provider>;
}

export function useLiveData() {
  const context = useContext(LiveDataContext);

  if (!context) {
    throw new Error("useLiveData must be used inside LiveDataProvider");
  }

  return context;
}
