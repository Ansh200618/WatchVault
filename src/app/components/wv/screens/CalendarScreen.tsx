import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLiveData } from "../../../services/liveData";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function CalendarScreen() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today.getDate());
  const { upcoming } = useLiveData();
  const month = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const firstDay = viewDate.getDay();
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const events = useMemo(() => upcoming.reduce<Record<number, { type: "release" | "reminder" | "watched"; title: string }[]>>((acc, item) => {
    if (!item.releaseDate) return acc;
    const date = new Date(item.releaseDate);
    if (date.getFullYear() !== viewDate.getFullYear() || date.getMonth() !== viewDate.getMonth()) return acc;
    const day = date.getDate();
    acc[day] = [...(acc[day] || []), { type: "release", title: `${item.title} releases` }];
    return acc;
  }, {}), [upcoming, viewDate]);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
    setViewDate(next);
    setSelected(1);
  };

  const goToday = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(today.getDate());
  };

  return (
    <div className="h-full overflow-y-auto pb-28">
      <div className="px-5 pt-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftMonth(-1)} className="w-9 h-9 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-center">
            <ChevronLeft size={16} className="text-[#111] dark:text-white" />
          </button>
          <div className="text-[#111] dark:text-white" style={{ fontSize: 20, fontWeight: 700 }}>{month}</div>
          <button onClick={() => shiftMonth(1)} className="w-9 h-9 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-center">
            <ChevronRight size={16} className="text-[#111] dark:text-white" />
          </button>
        </div>
        <button onClick={goToday} className="px-4 py-2 rounded-full bg-[#111] text-white dark:bg-white dark:text-black" style={{ fontSize: 12, fontWeight: 600 }}>
          Today
        </button>
      </div>

      <div className="px-5 mt-5">
        <div className="p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A]" style={{ borderRadius: 28 }}>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d, i) => <div key={i} className="text-center text-[#666666]" style={{ fontSize: 11, fontWeight: 600 }}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              const isSel = d === selected;
              const ev = d ? events[d] : undefined;
              return (
                <button
                  key={i}
                  disabled={!d}
                  onClick={() => d && setSelected(d)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative ${isSel ? "bg-[#111] text-white dark:bg-white dark:text-black" : "text-[#111] dark:text-white"} ${!d ? "opacity-0" : ""}`}
                  style={{ fontSize: 13, fontWeight: isSel ? 700 : 500 }}
                >
                  {d}
                  {ev && <div className="absolute bottom-1.5 flex gap-0.5">{ev.map((_, idx) => <div key={idx} className="w-1 h-1 rounded-full bg-[#D9A441]" />)}</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-5 mt-5">
        <div className="text-[#111] dark:text-white mb-3" style={{ fontSize: 16, fontWeight: 600 }}>
          {new Date(viewDate.getFullYear(), viewDate.getMonth(), selected).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
        </div>
        <div className="space-y-2">
          {(events[selected] ?? []).map((e, i) => (
            <div key={i} className="p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center gap-3" style={{ borderRadius: 20 }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#D9A441]/20 text-[#7A5A1F]">R</div>
              <div className="flex-1">
                <div className="text-[#111] dark:text-white" style={{ fontSize: 13, fontWeight: 600 }}>{e.title}</div>
                <div className="text-[#666666] capitalize" style={{ fontSize: 11 }}>{e.type}</div>
              </div>
            </div>
          ))}
          {!events[selected] && <div className="text-center py-6 text-[#666666]" style={{ fontSize: 13 }}>No events this day.</div>}
        </div>
      </div>
    </div>
  );
}
