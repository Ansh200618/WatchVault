import { useEffect, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import type { Media } from "../../../data";
import { FilterChips, SearchBar, PosterCard } from "../shared";
import { EmptyState, ErrorState, ShimmerGrid } from "../states";
import { useLiveData } from "../../../services/liveData";

const FILTERS = ["All", "Movies", "Series", "Anime", "Upcoming"];

export function Discover({ onOpen }: { onOpen: (m: Media) => void }) {
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Media[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { media, loading, error, refresh, searchMedia } = useLiveData();
  const source = searchResults ?? media;
  const filtered = source.filter((m) => {
    if (filter === "All") return true;
    if (filter === "Upcoming") return m.status === "Upcoming";
    if (filter === "Movies") return m.type === "Movie";
    if (filter === "Series") return m.type === "Series";
    if (filter === "Anime") return m.type === "Anime";
    return true;
  });

  useEffect(() => {
    const trimmed = query.trim();
    const kind = filter === "Movies" ? "movie" : filter === "Series" ? "tv" : filter === "Anime" ? "anime" : undefined;

    if (!trimmed) {
      setSearchResults(null);
      setSearchError(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      searchMedia(trimmed, kind)
        .then((results) => {
          setSearchResults(results);
          setSearchError(null);
        })
        .catch((err) => {
          setSearchError(err instanceof Error ? err.message : "Search failed");
          setSearchResults([]);
        });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [filter, query, searchMedia]);

  return (
    <div className="h-full overflow-y-auto px-5 pt-12" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 132px)" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[#111] dark:text-white" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
          Discover
        </div>
        <div className="flex gap-1 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] p-1 rounded-full flex-shrink-0">
          <button
            onClick={() => setView("grid")}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${view === "grid" ? "bg-[#111] text-white dark:bg-white dark:text-black" : "text-[#666666]"}`}
            aria-label="Grid view"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView("list")}
            className={`w-9 h-9 rounded-full flex items-center justify-center ${view === "list" ? "bg-[#111] text-white dark:bg-white dark:text-black" : "text-[#666666]"}`}
            aria-label="List view"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      <SearchBar value={query} onChange={setQuery} />

      <div className="mt-4">
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
      </div>

      <div className="mt-5">
        {loading && media.length === 0 ? (
          <ShimmerGrid />
        ) : error || searchError ? (
          <ErrorState onRetry={refresh} />
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-6">
            {filtered.map((m) => (
              <PosterCard key={m.id} m={m} onClick={() => onOpen(m)} fluid />
            ))}
          </div>
        ) : (
          <div className="space-y-3 pb-6">
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => onOpen(m)}
                className="w-full flex gap-3 p-3 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-left"
                style={{ borderRadius: 24 }}
              >
                <div className="w-16 h-20 rounded-2xl overflow-hidden bg-[#E5E5E5] flex-shrink-0">
                  <img src={m.poster} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#111] dark:text-white line-clamp-1" style={{ fontSize: 15, fontWeight: 600 }}>
                    {m.title}
                  </div>
                  <div className="text-[#666666] dark:text-[#B8B8B8]" style={{ fontSize: 12 }}>
                    {m.type} · {m.year} · ★ {m.rating}
                  </div>
                  <div className="text-[#666666] dark:text-[#B8B8B8] line-clamp-2 mt-1" style={{ fontSize: 12 }}>
                    {m.overview}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        {filtered.length === 0 && <EmptyState />}
      </div>
    </div>
  );
}