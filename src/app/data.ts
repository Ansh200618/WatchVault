/**
 * WatchVault API-ready type definitions.
 *
 * Sources by domain:
 * - Movies / Series / Upcoming / Seasons / Episodes / Providers -> TMDB
 * - IMDb, Rotten Tomatoes, Metacritic ratings -> OMDb
 * - Anime -> AniList / Jikan
 * - Legal streaming availability by region -> Watchmode
 */

export type MediaKind = "movie" | "tv" | "anime";
export type LibraryStatus = "watching" | "plan" | "completed" | "dropped" | "on_hold" | "favorite";

/** Score normalised to 0-10 unless explicitly noted otherwise. */
export interface RatingItem {
  source: "TMDB" | "IMDb" | "RottenTomatoes" | "Metacritic" | "AniList" | "User";
  value: number | null;
  scale: 10 | 100;
  votes?: number | null;
}

export interface WatchProviderItem {
  id: string;
  name: string;
  logoUrl: string | null;
  type: "subscription" | "rent" | "buy" | "free" | "ads";
  region: string;
  deepLinkUrl?: string | null;
}

export interface EpisodeItem {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string | null;
  airDate: string | null;
  runtimeMinutes: number | null;
  stillUrl: string | null;
  overview: string | null;
  watched: boolean;
}

export interface SeasonItem {
  id: string;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string | null;
  posterUrl: string | null;
  watchedCount: number;
  episodes?: EpisodeItem[];
}

interface BaseMediaItem {
  id: string;
  kind: MediaKind;
  title: string;
  originalTitle: string | null;
  year: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  overview: string | null;
  genres: string[];
  languages: string[];
  ratings: RatingItem[];
  providers: WatchProviderItem[];
  trailerUrl: string | null;
}

export interface MovieItem extends BaseMediaItem {
  kind: "movie";
  runtimeMinutes: number | null;
  releaseDate: string | null;
}

export interface TvItem extends BaseMediaItem {
  kind: "tv";
  firstAirDate: string | null;
  lastAirDate: string | null;
  episodeRuntimeMinutes: number | null;
  seasonCount: number;
  episodeCount: number;
  status: "Returning" | "Ended" | "Canceled" | "InProduction" | "Pilot";
  seasons: SeasonItem[];
}

export interface AnimeItem extends BaseMediaItem {
  kind: "anime";
  format: "TV" | "Movie" | "OVA" | "Special" | "ONA";
  episodeCount: number | null;
  durationMinutes: number | null;
  seasons: SeasonItem[];
  studio: string | null;
  source: "anilist" | "jikan";
}

export type MediaItem = MovieItem | TvItem | AnimeItem;

export interface UpcomingReleaseItem {
  mediaId: string;
  kind: MediaKind;
  title: string;
  posterUrl: string | null;
  releaseDate: string;
  region: string;
  language: string;
  reminderSet: boolean;
}

export type ReminderOffset = "release_day" | "1d" | "3d" | "1w" | "custom";
export interface ReminderItem {
  id: string;
  mediaId: string;
  offset: ReminderOffset;
  customDateTime?: string | null;
  enabled: boolean;
}

export interface UserLibraryItem {
  mediaId: string;
  status: LibraryStatus;
  progressPercent: number;
  lastEpisode?: { season: number; episode: number } | null;
  rating?: number | null;
  notes?: string | null;
  media?: MediaItem | null;
  addedAt: string;
  updatedAt: string;
}

export interface WatchStatsItem {
  moviesWatched: number;
  episodesWatched: number;
  animeCompleted: number;
  watchHours: number;
  pendingTitles: number;
  completionRatePercent: number;
  favoriteGenre: string | null;
  favoriteLanguage: string | null;
  monthlyHours: { m: string; h: number }[];
  genreDistribution: { name: string; v: number; c: string }[];
}

export interface BrainInsight {
  id: string;
  kind:
    | "pending_today"
    | "release_tomorrow"
    | "resume_series"
    | "weekend_pick"
    | "high_priority";
  text: string;
  actionLabel: string;
  mediaId?: string;
}

export type ApiName = "TMDB" | "OMDb" | "AniList" | "Jikan" | "Watchmode";
export interface ApiStatusItem {
  name: ApiName;
  state: "ready" | "connected" | "key_missing" | "error";
  hint: string;
}

export type MediaType = "Movie" | "Series" | "Anime";
export type Media = {
  id: string;
  title: string;
  originalTitle?: string;
  type: MediaType;
  year: number;
  rating: number;
  runtime?: string;
  language: string;
  status?: "Watching" | "Completed" | "Plan" | "Dropped" | "On Hold" | "Favorite" | "Upcoming";
  progress?: number;
  lastEpisode?: string;
  poster: string;
  banner?: string;
  genres: string[];
  overview: string;
  releaseDate?: string;
  countdown?: string;
  seasons?: number;
  totalEpisodes?: number;
  watched?: number;
  providers?: string[];
  ratings?: RatingItem[];
  trailerUrl?: string | null;
  seasonDetails?: {
    id: string;
    seasonNumber: number;
    name: string;
    episodeCount: number;
    airDate?: string | null;
    posterUrl?: string | null;
    watchedCount?: number;
  }[];
};
