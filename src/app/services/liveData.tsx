import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type {
  ApiStatusItem,
  LibraryStatus,
  Media,
  MediaItem,
  UserLibraryItem,
  WatchStatsItem,
} from "../data";
import { API_BASE_URL, apiService, apiStatusToCards, mediaItemToMedia } from "./api";

type Insight = {
  icon?: string;
  text: string;
  action: string;
  mediaId?: string;
};

type MediaBuckets = {
  all: Media[];
  movies: Media[];
  series: Media[];
  anime: Media[];
};

type LiveDataState = {
  media: Media[];
  mediaBuckets: MediaBuckets;
  upcoming: Media[];
  insights: Insight[];
  apiStatus: ApiStatusItem[];
  stats: WatchStatsItem;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  searchMedia: (query: string, kind?: "movie" | "tv" | "anime") => Promise<Media[]>;
};

const emptyBuckets: MediaBuckets = {
  all: [],
  movies: [],
  series: [],
  anime: [],
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
    favorite: "Favorite",
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
  if (!item.media) return null;
  return {
    ...mediaItemToMedia(item.media as MediaItem),
    status: statusLabel(item.status),
    progress: item.progressPercent,
    lastEpisode: item.lastEpisode ? `S${item.lastEpisode.season} E${item.lastEpisode.episode}` : undefined,
  };
}

async function readJson<T>(path: string): Promise<T> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${cleanPath}`, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Failed to fetch ${cleanPath}`);
  return response.json();
}

function buildBuckets(items: Media[]): MediaBuckets {
  const all = uniqueById(items);
  return {
    all,
    movies: all.filter((item) => item.type === "Movie"),
    series: all.filter((item) => item.type === "Series"),
    anime: all.filter((item) => item.type === "Anime"),
  };
}

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const [media, setMedia] = useState<Media[]>([]);
  const [mediaBuckets, setMediaBuckets] = useState<MediaBuckets>(emptyBuckets);
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
      const [moviesResult, seriesResult, animeResult, libraryResult, upcomingResult, statusResult, statsResult, insightsResult] = await Promise.allSettled([
        apiService.getPopularMedia("movie"),
        apiService.getPopularMedia("tv"),
        apiService.getPopularMedia("anime"),
        apiService.getUserLibrary(),
        readJson<MediaItem[]>("/upcoming"),
        readJson<{ apis: Record<string, string> }>("/status"),
        apiService.getStats(),
        readJson<Insight[]>("/brain/insights"),
      ]);

      const movies = moviesResult.status === "fulfilled" ? moviesResult.value.map(mediaItemToMedia) : [];
      const series = seriesResult.status === "fulfilled" ? seriesResult.value.map(mediaItemToMedia) : [];
      const anime = animeResult.status === "fulfilled" ? animeResult.value.map(mediaItemToMedia) : [];
      const popular = uniqueById([...movies, ...series, ...anime]);
      const library = libraryResult.status === "fulfilled" ? libraryResult.value : [];
      const libraryMedia = library.map(mediaFromLibraryItem).filter((item): item is Media => Boolean(item));
      const upcomingMedia =
        upcomingResult.status === "fulfilled"
          ? upcomingResult.value.map((item) => ({ ...mediaItemToMedia(item), status: "Upcoming" as const }))
          : [];
      const merged = uniqueById(withLibrary([...libraryMedia, ...popular, ...upcomingMedia], library));
      const buckets = buildBuckets(merged);

      setUpcoming(upcomingMedia);
      setMedia(buckets.all);
      setMediaBuckets(buckets);
      setApiStatus(statusResult.status === "fulfilled" ? apiStatusToCards(statusResult.value.apis || {}) : []);
      setStats(statsResult.status === "fulfilled" ? statsResult.value : emptyStats);
      setInsights(insightsResult.status === "fulfilled" ? insightsResult.value : []);

      if (!merged.length && !upcomingMedia.length) {
        setError("No live API data returned. Check backend URL and API keys in Settings.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load live backend data");
      setMedia([]);
      setMediaBuckets(emptyBuckets);
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

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onOnline = () => void refresh();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [refresh]);

  const searchMedia = useCallback(async (query: string, kind?: "movie" | "tv" | "anime") => {
    if (!query.trim()) return media;
    try {
      const results = await apiService.searchMedia(query, kind);
      return results.map(mediaItemToMedia);
    } catch {
      return [];
    }
  }, [media]);

  const value = useMemo(
    () => ({ media, mediaBuckets, upcoming, insights, apiStatus, stats, loading, error, refresh, searchMedia }),
    [apiStatus, error, insights, loading, media, mediaBuckets, refresh, searchMedia, stats, upcoming]
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
