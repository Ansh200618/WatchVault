import { MediaItem, MediaKind, LibraryStatus, type Media, type ApiStatusItem, type UserLibraryItem, type WatchStatsItem } from '../data';

// Use VITE_API_BASE_URL when configured; otherwise use local dev/proxy API paths.
// Do not default to a shared public backend because library endpoints are mutable.
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE_URL = (configuredApiBaseUrl || '/api').replace(/\/$/, '');

const pathFor = (path: string) => `${API_BASE_URL}${path}`;
const seg = (value: string) => encodeURIComponent(value);

/**
 * API Service for communicating with WatchVault backend
 */
export const apiService = {
  healthCheck: async () => {
    const response = await fetch(pathFor('/health'));
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  },

  getPopularMedia: async (kind?: MediaKind): Promise<MediaItem[]> => {
    const params = kind ? `?${new URLSearchParams({ kind }).toString()}` : '';
    const response = await fetch(pathFor(`/media/popular${params}`));
    if (!response.ok) throw new Error('Failed to fetch popular media');
    return response.json();
  },

  searchMedia: async (query: string, kind?: MediaKind): Promise<MediaItem[]> => {
    const params = new URLSearchParams();
    params.append('q', query);
    if (kind) params.append('kind', kind);

    const response = await fetch(pathFor(`/media/search?${params.toString()}`));
    if (!response.ok) throw new Error('Failed to search media');
    return response.json();
  },

  getMediaById: async (id: string): Promise<MediaItem> => {
    const response = await fetch(pathFor(`/media/${seg(id)}`));
    if (!response.ok) throw new Error('Failed to fetch media details');
    return response.json();
  },

  getUserLibrary: async (): Promise<UserLibraryItem[]> => {
    const response = await fetch(pathFor('/user/library'));
    if (!response.ok) throw new Error('Failed to fetch user library');
    return response.json();
  },

  getStats: async (): Promise<WatchStatsItem> => {
    const response = await fetch(pathFor('/user/stats'));
    if (!response.ok) throw new Error('Failed to fetch watch stats');
    return response.json();
  },

  updateLibraryItem: async (mediaId: string, updates: Partial<{ status: LibraryStatus; progressPercent: number; lastEpisode: { season: number; episode: number } | null; rating: number | null; notes: string | null; media: MediaItem | null }>) => {
    const response = await fetch(pathFor(`/user/library/${seg(mediaId)}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update library item');
    return response.json();
  },

  addLibraryItem: async (item: { mediaId: string; status?: LibraryStatus; progressPercent?: number; lastEpisode?: { season: number; episode: number } | null; rating?: number | null; notes?: string | null; media?: MediaItem | null }) => {
    const response = await fetch(pathFor('/user/library'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to add library item');
    return response.json();
  },

  deleteLibraryItem: async (mediaId: string) => {
    const response = await fetch(pathFor(`/user/library/${seg(mediaId)}`), { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to remove library item');
    return response.json();
  },

  getSeasonEpisodes: async (mediaId: string, seasonNumber: number) => {
    const response = await fetch(pathFor(`/media/${seg(mediaId)}/season/${seasonNumber}`));
    if (!response.ok) throw new Error('Failed to fetch season episodes');
    return response.json();
  },

  searchOMDb: async (params: { i?: string; t?: string; y?: string; type?: string; page?: string }) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(pathFor(`/omdb?${queryParams}`));
    if (!response.ok) throw new Error('OMDb API request failed');
    return response.json();
  },

  searchAniList: async (query: string, variables: Record<string, any> = {}) => {
    const response = await fetch(pathFor('/anilist'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    if (!response.ok) throw new Error('AniList API request failed');
    return response.json();
  },

  searchJikan: async (endpoint: string, params: Record<string, string> = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(pathFor(`/jikan/${endpoint}?${queryParams}`));
    if (!response.ok) throw new Error('Jikan API request failed');
    return response.json();
  },

  searchWatchmode: async (endpoint: string, params: Record<string, string> = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(pathFor(`/watchmode/${endpoint}?${queryParams}`));
    if (!response.ok) throw new Error('Watchmode API request failed');
    return response.json();
  }
};

export function mediaItemToMedia(item: MediaItem): Media {
  const firstRating = item.ratings.find((rating) => rating.value !== null);
  const rating =
    firstRating?.value === null || firstRating?.value === undefined
      ? 0
      : firstRating.scale === 100
        ? Number((firstRating.value / 10).toFixed(1))
        : Number(firstRating.value.toFixed(1));
  const releaseDate =
    item.kind === 'movie'
      ? item.releaseDate
      : item.kind === 'tv'
        ? item.firstAirDate
        : item.seasons[0]?.airDate || null;
  const runtime =
    item.kind === 'movie'
      ? item.runtimeMinutes
      : item.kind === 'tv'
        ? item.episodeRuntimeMinutes
        : item.durationMinutes;

  return {
    id: item.id,
    title: item.title,
    originalTitle: item.originalTitle || undefined,
    type: item.kind === 'movie' ? 'Movie' : item.kind === 'tv' ? 'Series' : 'Anime',
    year: item.year || 0,
    rating,
    runtime: runtime ? `${runtime}m` : undefined,
    language: item.languages[0] || 'Unknown',
    poster: item.posterUrl || item.backdropUrl || '',
    banner: item.backdropUrl || item.posterUrl || undefined,
    genres: item.genres,
    overview: item.overview || 'No overview available.',
    releaseDate: releaseDate || undefined,
    status: undefined,
    providers: item.providers.map((provider: any) => provider.name || provider.providerName).filter(Boolean),
    ratings: item.ratings,
    trailerUrl: item.trailerUrl,
    seasonDetails:
      item.kind === 'tv' || item.kind === 'anime'
        ? item.seasons.map((season) => ({
            id: season.id,
            seasonNumber: season.seasonNumber,
            name: season.name,
            episodeCount: season.episodeCount,
            airDate: season.airDate,
            posterUrl: season.posterUrl,
            watchedCount: season.watchedCount,
          }))
        : undefined,
    seasons: item.kind === 'tv' ? item.seasonCount : item.kind === 'anime' ? item.seasons.length : undefined,
    totalEpisodes: item.kind === 'tv' ? item.episodeCount : item.kind === 'anime' ? item.episodeCount || undefined : undefined,
    watched: 0,
  };
}

export function apiStatusToCards(status: Record<string, string>): ApiStatusItem[] {
  return Object.entries(status).map(([name, state]) => ({
    name: name as ApiStatusItem['name'],
    state: state === 'configured' || state === 'public' ? 'connected' : 'key_missing',
    hint: state === 'configured' || state === 'public' ? 'Connected to backend proxy' : 'Add key in backend/.env',
  }));
}

export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};

export default apiService;
