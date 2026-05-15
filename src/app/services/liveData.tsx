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
import {
  fallbackApiStatus,
  fallbackInsights,
  fallbackMedia,
  fallbackStats,
  fallbackUpcoming,
  filterFallbackMedia,
  type Insight,
} from "./fallbackData";

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
  const [media, setMedia] = useState<Media[]>(fallbackMedia);
  const [upcoming, setUpcoming] = useState<Media[]>(fallbackUpcoming);
  const [insights, setInsights] = useState<Insight[]>(fallbackInsights);
  const [apiStatus, setApiStatus] = useState<ApiStatusItem[]>(fallbackApiStatus);
  const [stats, setStats] = useState<WatchStatsItem>(fallbackStats);
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
      const merged = uniqueById(withLibrary([...libraryMedia, ...popular, ...upcomingMedia], library));

      setUpcoming(upcomingMedia.length ? upcomingMedia : fallbackUpcoming);
      setMedia(merged.length ? merged : fallbackMedia);
      setApiStatus(statusResult.status === "fulfilled" ? apiStatusToCards(statusResult.value.apis || {}) : fallbackApiStatus);
      setStats(statsResult.status === "fulfilled" ? statsResult.value : fallbackStats);
      setInsights(insightsResult.status === "fulfilled" && insightsResult.value.length ? insightsResult.value : fallbackInsights);
    } catch {
      setError(null);
      setMedia(fallbackMedia);
      setUpcoming(fallbackUpcoming);
      setInsights(fallbackInsights);
      setApiStatus(fallbackApiStatus);
      setStats(fallbackStats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const searchMedia = useCallback(async (query: string, kind?: "movie" | "tv" | "anime") => {
    if (!query.trim()) return media.length ? media : fallbackMedia;
    try {
      const results = await apiService.searchMedia(query, kind);
      const mapped = results.map(mediaItemToMedia);
      return mapped.length ? mapped : filterFallbackMedia(query, kind);
    } catch {
      return filterFallbackMedia(query, kind);
    }
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
