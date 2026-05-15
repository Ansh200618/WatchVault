import type { ApiStatusItem, Media, WatchStatsItem } from "../data";

export type Insight = { icon: string; text: string; action: string; mediaId?: string };

export const fallbackMedia: Media[] = [
  {
    id: "local:movie:interstellar",
    title: "Interstellar",
    type: "Movie",
    year: 2014,
    rating: 8.7,
    runtime: "169m",
    language: "English",
    status: "Completed",
    progress: 100,
    poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    banner: "https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    genres: ["Sci-Fi", "Drama", "Adventure"],
    overview: "A team travels through a wormhole to find a new home for humanity.",
    releaseDate: "2014-11-07",
    providers: ["Prime Video", "Apple TV"],
    watched: 1,
  },
  {
    id: "local:series:dark",
    title: "Dark",
    type: "Series",
    year: 2017,
    rating: 8.8,
    runtime: "50m",
    language: "German",
    status: "Watching",
    progress: 54,
    lastEpisode: "S2 E3",
    poster: "https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg",
    banner: "https://image.tmdb.org/t/p/w1280/5LoHuHWA4H8jElFlZDvsmU2n63b.jpg",
    genres: ["Mystery", "Sci-Fi", "Thriller"],
    overview: "A missing child exposes the secrets of four families across time.",
    releaseDate: "2017-12-01",
    seasons: 3,
    totalEpisodes: 26,
    watched: 14,
    providers: ["Netflix"],
  },
  {
    id: "local:anime:jjk",
    title: "Jujutsu Kaisen",
    type: "Anime",
    year: 2020,
    rating: 8.6,
    runtime: "24m",
    language: "Japanese",
    status: "Watching",
    progress: 68,
    lastEpisode: "S2 E7",
    poster: "https://image.tmdb.org/t/p/w500/hFWP5HkbVEe40hrXgtCeQxoccHE.jpg",
    banner: "https://image.tmdb.org/t/p/w1280/gL8myjGc2qrmqVosyGm5CWTir9A.jpg",
    genres: ["Action", "Dark", "Supernatural"],
    overview: "A student joins sorcerers fighting dangerous curses.",
    releaseDate: "2020-10-03",
    seasons: 2,
    totalEpisodes: 47,
    watched: 32,
    providers: ["Crunchyroll"],
  },
  {
    id: "local:movie:dune2",
    title: "Dune: Part Two",
    type: "Movie",
    year: 2024,
    rating: 8.5,
    runtime: "166m",
    language: "English",
    status: "Plan",
    progress: 0,
    poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    banner: "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    genres: ["Sci-Fi", "Adventure", "Drama"],
    overview: "Paul unites with Chani and the Fremen while seeking revenge.",
    releaseDate: "2024-03-01",
    providers: ["Apple TV", "Google Play"],
  },
  {
    id: "local:anime:solo2",
    title: "Solo Leveling Season 2",
    type: "Anime",
    year: 2026,
    rating: 0,
    runtime: "24m",
    language: "Japanese",
    status: "Upcoming",
    progress: 0,
    poster: "https://image.tmdb.org/t/p/w500/geCRueV3ElhRTr0xtJuEWJt6dJ1.jpg",
    banner: "https://image.tmdb.org/t/p/w1280/o8dPH0ZSIyyViP6rjRX1djwCUwI.jpg",
    genres: ["Action", "Fantasy", "Anime"],
    overview: "The next chapter of Sung Jin-Woo's rise continues.",
    releaseDate: "2026-07-15",
    countdown: "Coming soon",
    seasons: 1,
    totalEpisodes: 12,
    watched: 0,
    providers: ["Crunchyroll"],
  },
];

export const fallbackUpcoming = fallbackMedia.filter((item) => item.status === "Upcoming");

export const fallbackStats: WatchStatsItem = {
  moviesWatched: 1,
  episodesWatched: 46,
  animeCompleted: 0,
  watchHours: 42,
  pendingTitles: 2,
  completionRatePercent: 25,
  favoriteGenre: "Sci-Fi",
  favoriteLanguage: "English",
  monthlyHours: [
    { m: "Jan", h: 8 },
    { m: "Feb", h: 12 },
    { m: "Mar", h: 5 },
    { m: "Apr", h: 9 },
    { m: "May", h: 8 },
  ],
  genreDistribution: [
    { name: "Sci-Fi", v: 35, c: "#D9A441" },
    { name: "Action", v: 28, c: "#F3C76A" },
    { name: "Thriller", v: 21, c: "#9CA3AF" },
    { name: "Drama", v: 16, c: "#666666" },
  ],
};

export const fallbackInsights: Insight[] = [
  { icon: "NEXT", text: "Continue Dark from S2 E3.", action: "Open Tracker", mediaId: "local:series:dark" },
  { icon: "ANIME", text: "Jujutsu Kaisen is your strongest current anime.", action: "Open Library", mediaId: "local:anime:jjk" },
  { icon: "UPCOMING", text: "Solo Leveling Season 2 is on your upcoming radar.", action: "Calendar", mediaId: "local:anime:solo2" },
];

export const fallbackApiStatus: ApiStatusItem[] = [
  { name: "TMDB", state: "ready", hint: "Offline APK fallback active" },
  { name: "OMDb", state: "ready", hint: "Offline APK fallback active" },
  { name: "AniList", state: "ready", hint: "Offline APK fallback active" },
  { name: "Jikan", state: "ready", hint: "Offline APK fallback active" },
  { name: "Watchmode", state: "ready", hint: "Offline APK fallback active" },
];

export function filterFallbackMedia(query: string, kind?: "movie" | "tv" | "anime") {
  const text = query.trim().toLowerCase();
  const type = kind === "movie" ? "Movie" : kind === "tv" ? "Series" : kind === "anime" ? "Anime" : undefined;
  return fallbackMedia.filter((item) => {
    const matchesKind = !type || item.type === type;
    const matchesText = !text || [item.title, item.overview, item.language, ...(item.genres || [])].join(" ").toLowerCase().includes(text);
    return matchesKind && matchesText;
  });
}
