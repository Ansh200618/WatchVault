import { MediaItem, MediaKind, LibraryStatus, type Media, type ApiStatusItem, type UserLibraryItem, type WatchStatsItem } from '../data';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE_URL = (configuredApiBaseUrl || 'https://watchvault-backend-2lrv.onrender.com/api').replace(/\/$/, '');

const pathFor = (path: string) => `${API_BASE_URL}${path}`;
const seg = (value: string) => encodeURIComponent(value);
const DEVICE_STORAGE_KEY = 'watchvault:device-id';
type WatchedEpisodeMap = Record<string, boolean>;
type LibraryMutation = Partial<{
  status: LibraryStatus;
  progressPercent: number;
  lastEpisode: { season: number; episode: number } | null;
  watchedEpisodes: WatchedEpisodeMap;
  rating: number | null;
  notes: string | null;
  media: MediaItem | null;
}>;

function createLocalId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function cleanClientId(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 80) : '';
}

function getUserId() {
  try {
    const prefs = JSON.parse(window.localStorage.getItem('watchvault:prefs') || '{}');
    return cleanClientId(prefs.userId) || 'anonymous';
  } catch {
    return 'anonymous';
  }
}

export function getWatchVaultDeviceId() {
  try {
    const existing = cleanClientId(window.localStorage.getItem(DEVICE_STORAGE_KEY));
    if (existing) return existing;
    const created = createLocalId('dev');
    window.localStorage.setItem(DEVICE_STORAGE_KEY, created);
    return created;
  } catch {
    return 'dev_unknown';
  }
}

function userHeaders(extra: Record<string, string> = {}) {
  return {
    ...extra,
    'X-WatchVault-User': getUserId(),
    'X-WatchVault-Device': getWatchVaultDeviceId(),
  };
}

async function jsonOrThrow(response: Response, fallbackMessage: string) {
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(body?.message || body?.error || fallbackMessage);
  return body;
}

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
    const response = await fetch(pathFor('/user/library'), { headers: userHeaders() });
    if (!response.ok) throw new Error('Failed to fetch user library');
    return response.json();
  },

  getStats: async (): Promise<WatchStatsItem> => {
    const response = await fetch(pathFor('/user/stats'), { headers: userHeaders() });
    if (!response.ok) throw new Error('Failed to fetch watch stats');
    return response.json();
  },

  updateLibraryItem: async (mediaId: string, updates: LibraryMutation) => {
    const response = await fetch(pathFor(`/user/library/${seg(mediaId)}`), {
      method: 'PATCH',
      headers: userHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates)
    });
    return jsonOrThrow(response, 'Failed to update library item');
  },

  addLibraryItem: async (item: { mediaId: string } & LibraryMutation) => {
    const response = await fetch(pathFor('/user/library'), {
      method: 'POST',
      headers: userHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(item)
    });
    return jsonOrThrow(response, 'Failed to add library item');
  },

  deleteLibraryItem: async (mediaId: string) => {
    const response = await fetch(pathFor(`/user/library/${seg(mediaId)}`), { method: 'DELETE', headers: userHeaders() });
    return jsonOrThrow(response, 'Failed to remove library item');
  },

  exportUserData: async () => {
    const response = await fetch(pathFor('/user/export'), { headers: userHeaders() });
    return jsonOrThrow(response, 'Failed to export progress');
  },

  importUserData: async (backup: unknown) => {
    const response = await fetch(pathFor('/user/import'), {
      method: 'POST',
      headers: userHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(backup),
    });
    return jsonOrThrow(response, 'Failed to import progress');
  },

  recoverUserData: async (userId: string) => {
    const response = await fetch(pathFor('/user/recover'), {
      method: 'POST',
      headers: userHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ userId }),
    });
    return jsonOrThrow(response, 'Failed to recover progress');
  },

  getUserDevices: async () => {
    const response = await fetch(pathFor('/user/devices'), { headers: userHeaders() });
    return jsonOrThrow(response, 'Failed to check linked devices');
  },

  getUserProfile: async () => {
    const response = await fetch(pathFor('/user/profile'), { headers: userHeaders() });
    return jsonOrThrow(response, 'Failed to load account profile');
  },

  updateUserProfile: async (username: string) => {
    const response = await fetch(pathFor('/user/profile'), {
      method: 'PATCH',
      headers: userHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ username }),
    });
    return jsonOrThrow(response, 'Failed to update account profile');
  },

  deleteUserAccount: async () => {
    const response = await fetch(pathFor('/user/account'), {
      method: 'DELETE',
      headers: userHeaders(),
    });
    return jsonOrThrow(response, 'Failed to delete account');
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

function cleanLanguages(item: MediaItem) {
  const values = [
    ...(item.audioLanguages || []),
    ...(item.languages || []),
  ]
    .map((language) => String(language || '').trim())
    .filter(Boolean);

  return Array.from(new Set(values));
}

function releaseDateFor(item: MediaItem) {
  if (item.releaseType === 'episode' || item.releaseType === 'anime_episode') {
    const firstSeason = item.kind === 'tv' || item.kind === 'anime' ? item.seasons?.[0] : undefined;
    const firstEpisode = firstSeason?.episodes?.[0];
    return firstEpisode?.airDate || firstSeason?.airDate || undefined;
  }

  if (item.kind === 'movie') return item.releaseDate || undefined;
  if (item.kind === 'tv') return item.firstAirDate || item.seasons?.[0]?.airDate || undefined;
  return item.seasons[0]?.airDate || undefined;
}

export function mediaItemToMedia(item: MediaItem): Media {
  const firstRating = item.ratings.find((rating) => rating.value !== null);
  const rating =
    firstRating?.value === null || firstRating?.value === undefined
      ? 0
      : firstRating.scale === 100
        ? Number((firstRating.value / 10).toFixed(1))
        : Number(firstRating.value.toFixed(1));
  const releaseDate = releaseDateFor(item);
  const runtime =
    item.kind === 'movie'
      ? item.runtimeMinutes
      : item.kind === 'tv'
        ? item.episodeRuntimeMinutes
        : item.durationMinutes;
  const audioLanguages = cleanLanguages(item);

  return {
    id: item.id,
    title: item.title,
    originalTitle: item.originalTitle || undefined,
    type: item.kind === 'movie' ? 'Movie' : item.kind === 'tv' ? 'Series' : 'Anime',
    year: item.year || 0,
    rating,
    runtime: runtime ? `${runtime}m` : undefined,
    language: item.languages[0] || audioLanguages[0] || 'Unknown',
    audioLanguages,
    poster: item.posterUrl || item.backdropUrl || '',
    banner: item.backdropUrl || item.posterUrl || undefined,
    genres: item.genres,
    overview: item.overview || 'No overview available.',
    releaseDate,
    releaseType: item.releaseType,
    parentTitle: item.parentTitle || undefined,
    seasonNumber: item.seasonNumber || undefined,
    episodeNumber: item.episodeNumber || undefined,
    episodeTitle: item.episodeTitle || undefined,
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