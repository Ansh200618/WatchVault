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
    <div
      className="absolute left-4 right-4 z-20 pointer-events-none"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <div
        className="pointer-events-auto"
        style={{
          borderRadius: 30,
          height: 70,
          background: "rgba(8,8,12,0.86)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 18px 40px -10px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.14)",
        }}
      >
        <div className="grid grid-cols-5 h-full px-2">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className="min-w-0 flex flex-col items-center justify-center gap-0.5 transition rounded-3xl"
                style={{
                  height: 58,
                  alignSelf: "center",
                  background: isActive ? `linear-gradient(180deg, ${rgbToCss(color, 0.32)} 0%, ${rgbToCss(color, 0.11)} 100%)` : "transparent",
                  border: isActive ? "1px solid rgba(255,255,255,0.16)" : "1px solid transparent",
                  boxShadow: isActive ? `0 8px 18px -6px ${rgbToCss(color, 0.5)}` : "none",
                }}
                aria-label={label}
              >
                <div className="relative flex items-center justify-center">
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
                  className={`block max-w-full truncate ${isActive ? "text-white" : "text-white/55"}`}
                  style={{ fontSize: 10.5, fontWeight: isActive ? 650 : 500, marginTop: 6 }}
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