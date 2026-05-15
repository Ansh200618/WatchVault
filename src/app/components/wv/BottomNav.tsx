import { Home, Search, Bookmark, Calendar, User } from "lucide-react";
import { useArtwork, rgbToCss } from "./artwork";

export type Tab = "home" | "discover" | "library" | "calendar" | "profile";

const TABS: { id: Tab; label: string; Icon: any }[] = [
  { id: "home", label: "Home", Icon: Home },
  { id: "discover", label: "Discover", Icon: Search },
  { id: "library", label: "Library", Icon: Bookmark },
  { id: "calendar", label: "Calendar", Icon: Calendar },
  { id: "profile", label: "Profile", Icon: User },
];

export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const { color } = useArtwork();
  return (
    <div className="absolute left-5 right-5 bottom-4 z-20">
      <div
        style={{
          borderRadius: 32,
          height: 72,
          background: "rgba(10,10,14,0.45)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 18px 40px -10px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      >
        <div className="flex items-center justify-around h-full px-2">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className="flex flex-col items-center justify-center gap-0.5 px-3 transition rounded-3xl"
                style={{
                  height: 56,
                  minWidth: 58,
                  background: isActive ? `linear-gradient(180deg, ${rgbToCss(color, 0.35)} 0%, ${rgbToCss(color, 0.12)} 100%)` : "transparent",
                  border: isActive ? "1px solid rgba(255,255,255,0.18)" : "1px solid transparent",
                  boxShadow: isActive ? `0 8px 18px -6px ${rgbToCss(color, 0.55)}` : "none",
                }}
              >
                <div className="relative">
                  <Icon
                    size={isActive ? 22 : 20}
                    className={isActive ? "text-white" : "text-white/55"}
                    strokeWidth={isActive ? 2.4 : 1.6}
                  />
                  {isActive && (
                    <div
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                      style={{ background: rgbToCss(color, 1), boxShadow: `0 0 10px ${rgbToCss(color, 0.9)}` }}
                    />
                  )}
                </div>
                <span
                  className={isActive ? "text-white" : "text-white/55"}
                  style={{ fontSize: 10.5, fontWeight: isActive ? 600 : 500, marginTop: 6 }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
