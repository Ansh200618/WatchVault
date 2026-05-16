import { useEffect, useMemo, useState } from "react";
import { Bell, Sparkles } from "lucide-react";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import type { Media } from "../../../data";
import type { Tab } from "../BottomNav";
import { PosterCard, ContinueCard, UpcomingCard, SectionHeader } from "../shared";
import { useSetArtwork } from "../artwork";
import { GlassSearchBar, GlassChip } from "../glass";
import { usePrefs } from "../prefs";
import { useLiveData } from "../../../services/liveData";
import { useProfileImage } from "../../../services/profileImage";
import { LoadingState, ErrorState } from "../states";

const FILTERS = ["All", "Movies", "Series", "Anime", "Upcoming"] as const;
type HomeFilter = typeof FILTERS[number];

function filterToKind(filter: HomeFilter) {
  if (filter === "Movies") return "movie" as const;
  if (filter === "Series") return "tv" as const;
  if (filter === "Anime") return "anime" as const;
  return undefined;
}

function filterItems(items: Media[], filter: HomeFilter) {
  if (filter === "Movies") return items.filter((item) => item.type === "Movie");
  if (filter === "Series") return items.filter((item) => item.type === "Series");
  if (filter === "Anime") return items.filter((item) => item.type === "Anime");
  if (filter === "Upcoming") return items.filter((item) => item.status === "Upcoming");
  return items;
}

function bucketForFilter(filter: HomeFilter, buckets: ReturnType<typeof useLiveData>["mediaBuckets"], upcoming: Media[]) {
  if (filter === "Movies") return buckets.movies;
  if (filter === "Series") return buckets.series;
  if (filter === "Anime") return buckets.anime;
  if (filter === "Upcoming") return upcoming;
  return buckets.all;
}

export function Home({
  onOpen,
  onNavigate,
}: {
  onOpen: (m: Media) => void;
  onNavigate: (tab: Tab) => void;
}) {
  const [filter, setFilter] = useState<HomeFilter>("All");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Media[] | null>(null);
  const { prefs } = usePrefs();
  const profileImage = useProfileImage();
  const { media, mediaBuckets, upcoming, insights, loading, error, refresh, searchMedia } = useLiveData();

  const displayName = prefs.name?.trim() || "Watcher";
  const contentLabel = filter === "All" ? "Trending" : filter;
  const categoryMedia = useMemo(() => bucketForFilter(filter, mediaBuckets, upcoming), [filter, mediaBuckets, upcoming]);
  const visibleMedia = useMemo(() => {
    if (!query.trim()) return categoryMedia;
    return filterItems(searchResults ?? [], filter);
  }, [categoryMedia, filter, query, searchResults]);
  const filteredUpcoming = useMemo(() => {
    if (filter === "All") return upcoming;
    if (filter === "Upcoming") return upcoming;
    return filterItems(upcoming, filter);
  }, [filter, upcoming]);
  const continueList = visibleMedia.filter((m) => m.status === "Watching");
  const trending = visibleMedia.filter((m) => m.rating >= 7 || m.status === "Upcoming");
  const featured = visibleMedia[0] || categoryMedia[0] || media[0] || upcoming[0];

  useSetArtwork(featured?.poster || media[0]?.poster);

  useEffect(() => {
    const text = query.trim();
    const kind = filterToKind(filter);

    if (!text) {
      setSearchResults(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      if (filter === "Upcoming") {
        const localResults = upcoming.filter((item) =>
          [item.title, item.overview, item.language, ...(item.genres || [])].join(" ").toLowerCase().includes(text.toLowerCase())
        );
        setSearchResults(localResults);
        return;
      }

      searchMedia(text, kind).then(setSearchResults).catch(() => setSearchResults([]));
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [filter, query, searchMedia, upcoming]);

  const openInsightAction = (insight: { action: string; mediaId?: string }) => {
    const target = insight.mediaId ? media.find((item) => item.id === insight.mediaId) || upcoming.find((item) => item.id === insight.mediaId) : null;
    if (target) {
      onOpen(target);
      return;
    }

    const action = insight.action.toLowerCase();
    if (action.includes("discover")) onNavigate("discover");
    else if (action.includes("calendar")) onNavigate("calendar");
    else onNavigate("library");
  };

  return (
    <div className="h-full overflow-y-auto pb-28">
      <div className="px-5 pt-14 flex items-center justify-between">
        <div className="min-w-0 pr-3">
          <div className="text-white truncate" style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>
            Hello, {displayName}
          </div>
          <div className="text-white/70" style={{ fontSize: 13 }}>
            {contentLabel} in {prefs.regionName} - what are you watching today?
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setNotificationsOpen((open) => !open)}
            className="w-10 h-10 flex items-center justify-center text-white"
            style={{
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(22px) saturate(160%)",
              WebkitBackdropFilter: "blur(22px) saturate(160%)",
              border: "1px solid rgba(255,255,255,0.16)",
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
            aria-label="Open notifications"
          >
            <Bell size={16} />
          </button>
          <button
            onClick={() => onNavigate("profile")}
            className="w-10 h-10 rounded-full bg-[#D9A441] flex items-center justify-center text-black overflow-hidden"
            style={{ fontWeight: 700 }}
            aria-label="Open profile"
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase() || "W"
            )}
          </button>
        </div>
      </div>

      {notificationsOpen && (
        <div className="absolute top-24 left-5 right-5 z-40 p-4 bg-[#111111]/95 border border-white/15 shadow-2xl" style={{ borderRadius: 24, backdropFilter: "blur(24px)" }}>
          <div className="flex items-center justify-between">
            <div className="text-white" style={{ fontSize: 15, fontWeight: 700 }}>Notifications</div>
            <button onClick={() => setNotificationsOpen(false)} className="text-white/60" style={{ fontSize: 12 }}>Close</button>
          </div>
          <div className="mt-3 space-y-2">
            {upcoming.slice(0, 3).map((item) => (
              <button key={item.id} onClick={() => onOpen(item)} className="w-full text-left p-3 rounded-2xl bg-white/8 border border-white/10">
                <div className="text-white line-clamp-1" style={{ fontSize: 12, fontWeight: 700 }}>{item.title}</div>
                <div className="text-white/60" style={{ fontSize: 11 }}>{item.releaseDate || "Release date pending"}</div>
              </button>
            ))}
            {upcoming.length === 0 && (
              <div className="text-white/60 py-2" style={{ fontSize: 12 }}>No release reminders yet.</div>
            )}
          </div>
        </div>
      )}

      <div className="px-5 mt-5">
        <GlassSearchBar value={query} onChange={setQuery} />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar px-5 pb-1">
        {FILTERS.map((o) => (
          <GlassChip key={o} active={filter === o} onClick={() => setFilter(o)}>{o}</GlassChip>
        ))}
      </div>

      {query.trim() && (
        <SectionHeader title={`Search Results: ${query.trim()}`} action="Clear" onAction={() => setQuery("")} />
      )}

      <div className="px-5 mt-5">
        {loading && !featured && <LoadingState rows={2} />}
        {error && !featured && <ErrorState onRetry={refresh} />}
        {featured && (
          <button onClick={() => onOpen(featured)} className="relative w-full overflow-hidden text-left shadow-[0_18px_40px_-12px_rgba(0,0,0,0.35)]" style={{ borderRadius: 28, height: 240 }}>
            <ImageWithFallback src={featured.poster} alt={featured.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-2.5 py-1 rounded-full bg-white/90 text-black" style={{ fontSize: 10, fontWeight: 700 }}>
                {featured.type}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#D9A441] text-black" style={{ fontSize: 10, fontWeight: 700 }}>
                {featured.rating || "New"}
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div className="text-white min-w-0 pr-3">
                <div className="truncate" style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>{featured.title}</div>
                <div className="text-white/80 mt-1" style={{ fontSize: 12 }}>
                  {[featured.year || null, featured.lastEpisode || featured.runtime].filter(Boolean).join(" - ") || "Details available"}
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                  <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </button>
        )}
      </div>

      {continueList.length > 0 && (
        <>
          <SectionHeader title={`Continue Watching${filter !== "All" ? ` ${filter}` : ""}`} action="Library" onAction={() => onNavigate("library")} />
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-5">
            {continueList.map((m) => <ContinueCard key={m.id} m={m} onClick={() => onOpen(m)} />)}
          </div>
        </>
      )}

      {trending.length > 0 && (
        <>
          <SectionHeader title={query.trim() ? "Matching Titles" : `${contentLabel} Now`} action="Discover" onAction={() => onNavigate("discover")} />
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-5">
            {trending.map((m) => <PosterCard key={m.id} m={m} onClick={() => onOpen(m)} />)}
          </div>
        </>
      )}

      {filter !== "Upcoming" && filteredUpcoming.length > 0 && (
        <>
          <SectionHeader title="Upcoming Releases" action="Calendar" onAction={() => onNavigate("calendar")} />
          <div className="px-5 space-y-3">
            {filteredUpcoming.slice(0, 2).map((m) => <UpcomingCard key={m.id} m={m} onClick={() => onOpen(m)} />)}
          </div>
        </>
      )}

      {!loading && visibleMedia.length === 0 && !error && (
        <div className="px-5 mt-6">
          <div className="p-6 text-center bg-white/10 border border-white/15 text-white" style={{ borderRadius: 24, fontSize: 13 }}>
            No {filter.toLowerCase()} found right now. Try another filter or search.
          </div>
        </div>
      )}

      {insights.length > 0 && (
        <>
          <SectionHeader title="Watch Brain" action="Profile" onAction={() => onNavigate("profile")} />
          <div className="px-5 space-y-3">
            {insights.slice(0, 2).map((i, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-start gap-3" style={{ borderRadius: 24 }}>
                <div className="w-10 h-10 rounded-full bg-[#D9A441]/15 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={16} className="text-[#D9A441]" />
                </div>
                <div className="flex-1">
                  <div className="text-[#111] dark:text-white" style={{ fontSize: 14, fontWeight: 600 }}>{i.text}</div>
                  <button
                    onClick={() => openInsightAction(i)}
                    className="mt-2 px-3 py-1.5 rounded-full bg-[#111] text-white dark:bg-white dark:text-black"
                    style={{ fontSize: 11, fontWeight: 600 }}
                  >
                    {i.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}