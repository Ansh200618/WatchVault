import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Trash2 } from "lucide-react";
import type { Media } from "../../../data";
import { SearchBar, StatusChip } from "../shared";
import { useLiveData } from "../../../services/liveData";
import { apiService } from "../../../services/api";
import { LoadingState } from "../states";

const TABS = ["Watching", "Plan", "Completed", "Dropped", "On Hold", "Favorites"];

function statusForTab(tab: string) {
  return tab === "Favorites" ? "Favorite" : tab;
}

export function Library({ onOpen, onDiscover }: { onOpen: (m: Media) => void; onDiscover: () => void }) {
  const [tab, setTab] = useState("Watching");
  const [queryOpen, setQueryOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "rating" | "title">("recent");
  const [message, setMessage] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { media, loading, refresh } = useLiveData();

  const list = useMemo(() => {
    const targetStatus = statusForTab(tab);
    const filtered = media.filter((m) => m.status === targetStatus);
    const searched = filtered.filter((m) => m.title.toLowerCase().includes(query.toLowerCase().trim()));
    return [...searched].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "title") return a.title.localeCompare(b.title);
      return 0;
    });
  }, [media, query, sort, tab]);

  const cycleSort = () => {
    setSort((current) => current === "recent" ? "rating" : current === "rating" ? "title" : "recent");
  };

  const removeItem = async (item: Media) => {
    setRemovingId(item.id);
    try {
      await apiService.deleteLibraryItem(item.id);
      setMessage(`${item.title} removed from ${tab.toLowerCase()}`);
      await refresh();
    } catch {
      setMessage("Could not remove this title. Please try again.");
    } finally {
      setRemovingId(null);
      window.setTimeout(() => setMessage(null), 2500);
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-28">
      <div className="px-5 pt-14 flex items-center justify-between">
        <div className="text-[#111] dark:text-white" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
          My Library
        </div>
        <div className="flex gap-2">
          <button onClick={() => setQueryOpen((open) => !open)} className="w-10 h-10 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-center" aria-label="Search library">
            <Search size={14} className="text-[#111] dark:text-white" />
          </button>
          <button onClick={cycleSort} className="w-10 h-10 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-center" aria-label="Change library sort">
            <SlidersHorizontal size={14} className="text-[#111] dark:text-white" />
          </button>
        </div>
      </div>

      {queryOpen && (
        <div className="px-5 mt-4">
          <SearchBar value={query} onChange={setQuery} placeholder={`Search ${tab.toLowerCase()}`} />
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 mt-5 pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${tab === t ? "bg-[#111] text-white dark:bg-white dark:text-black" : "bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] text-[#111] dark:text-white"}`}
            style={{ fontSize: 12, fontWeight: 600 }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-5 mt-3 text-[#666666]" style={{ fontSize: 11 }}>
        Sorted by {sort === "rating" ? "rating" : sort === "title" ? "title" : "recent activity"}
      </div>

      {message && (
        <div className="mx-5 mt-3 px-4 py-2 rounded-2xl bg-[#D9A441]/20 text-[#F0C97A]" style={{ fontSize: 12, fontWeight: 700 }}>
          {message}
        </div>
      )}

      <div className="px-5 mt-4 space-y-3">
        {loading && media.length === 0 ? (
          <LoadingState />
        ) : list.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]" style={{ borderRadius: 28 }}>
            <div className="text-[#111] dark:text-white" style={{ fontSize: 16, fontWeight: 600 }}>No {tab.toLowerCase()} titles</div>
            <div className="text-[#666666] mt-1" style={{ fontSize: 13 }}>Add titles from details or discover something new.</div>
            <button onClick={onDiscover} className="mt-5 px-6 py-3 rounded-full bg-[#111] text-white dark:bg-white dark:text-black" style={{ fontSize: 13, fontWeight: 600 }}>
              Discover Titles
            </button>
          </div>
        ) : (
          list.map((m) => (
            <div key={m.id} className="w-full flex gap-3 p-3 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]" style={{ borderRadius: 24 }}>
              <button onClick={() => onOpen(m)} className="w-20 h-28 rounded-2xl overflow-hidden flex-shrink-0" aria-label={`Open ${m.title}`}>
                <img src={m.poster} alt="" className="w-full h-full object-cover" />
              </button>
              <div className="flex-1 min-w-0 text-left">
                <button onClick={() => onOpen(m)} className="w-full text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[#666666]" style={{ fontSize: 10 }}>{m.type}</span>
                    <StatusChip status={m.status} />
                  </div>
                  <div className="mt-1 text-[#111] dark:text-white line-clamp-1" style={{ fontSize: 15, fontWeight: 600 }}>{m.title}</div>
                  <div className="text-[#666666]" style={{ fontSize: 11 }}>{m.lastEpisode || `${m.year} - ${m.runtime || "Details"}`}</div>
                </button>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#E5E5E5] dark:bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div className="h-full bg-[#D9A441]" style={{ width: `${m.progress ?? 0}%` }} />
                  </div>
                  <span className="text-[#666666]" style={{ fontSize: 10 }}>{m.progress ?? 0}%</span>
                </div>
                <button
                  onClick={() => void removeItem(m)}
                  disabled={removingId === m.id}
                  className="mt-3 px-3 py-2 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 flex items-center gap-2 disabled:opacity-60"
                  style={{ fontSize: 11, fontWeight: 700 }}
                >
                  <Trash2 size={13} /> {removingId === m.id ? "Removing..." : tab === "Favorites" ? "Remove favorite" : "Remove"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}