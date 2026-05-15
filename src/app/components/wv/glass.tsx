import type { CSSProperties, ReactNode } from "react";
import { useArtwork, rgbToCss } from "./artwork";

/**
 * Reusable glassmorphism primitives.
 * All glass surfaces share:
 *   - backdrop-blur
 *   - translucent fill that adapts to dark/light theme
 *   - subtle 1px highlight border (top-light gradient)
 *   - soft drop shadow for floating depth
 */

type GlassProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  radius?: number;
  /** "card" = standard floating panel, "raised" = brighter glass, "deep" = dim glass */
  tone?: "card" | "raised" | "deep";
};

const glassStyle = (radius = 24, tone: GlassProps["tone"] = "card"): CSSProperties => {
  const tint =
    tone === "raised" ? "rgba(255,255,255,0.14)"
    : tone === "deep" ? "rgba(10,10,14,0.45)"
    : "rgba(255,255,255,0.08)";
  return {
    borderRadius: radius,
    background: tint,
    backdropFilter: "blur(22px) saturate(160%)",
    WebkitBackdropFilter: "blur(22px) saturate(160%)",
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow:
      "0 10px 30px -10px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
  };
};

export function GlassPanel({ children, className = "", style, radius = 24, tone = "card", onClick }: GlassProps) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{ ...glassStyle(radius, tone), ...style }}
    >
      {children}
    </div>
  );
}

export function GlassButton({
  children,
  className = "",
  style,
  onClick,
  variant = "primary",
}: GlassProps & { variant?: "primary" | "ghost" | "accent" }) {
  const { color } = useArtwork();
  const base: CSSProperties = {
    borderRadius: 999,
    padding: "12px 18px",
    fontSize: 13,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "transform .15s ease, background .2s ease",
  };
  if (variant === "primary") {
    Object.assign(base, {
      background: "rgba(255,255,255,0.96)",
      color: "#0a0a0a",
      boxShadow: "0 10px 24px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.6)",
    });
  } else if (variant === "accent") {
    Object.assign(base, {
      background: `linear-gradient(135deg, ${rgbToCss(color, 0.95)} 0%, ${rgbToCss(color, 0.6)} 100%)`,
      color: "white",
      border: "1px solid rgba(255,255,255,0.25)",
      boxShadow: `0 10px 30px -10px ${rgbToCss(color, 0.7)}`,
    });
  } else {
    Object.assign(base, glassStyle(999, "card"));
    Object.assign(base, { color: "white" });
  }
  return (
    <button onClick={onClick} className={className} style={{ ...base, ...style }}>
      {children}
    </button>
  );
}

export function GlassChip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="whitespace-nowrap transition"
      style={{
        ...glassStyle(999, active ? "raised" : "card"),
        padding: "8px 14px",
        fontSize: 12.5,
        fontWeight: 600,
        color: "white",
        background: active ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.08)",
        ...(active ? { color: "#0a0a0a", border: "1px solid rgba(255,255,255,0.6)" } : {}),
      }}
    >
      {children}
    </button>
  );
}

export function GlassSearchBar({
  placeholder = "Search movies, series, anime",
  value,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3"
      style={glassStyle(999, "card")}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="bg-transparent outline-none flex-1 text-white placeholder:text-white/50"
        style={{ fontSize: 13.5 }}
      />
    </div>
  );
}

export function GlassRatingChip({ value, source }: { value: number | null; source: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center px-2 py-2"
      style={{ ...glassStyle(18, "card"), minWidth: 56 }}
    >
      {value === null ? (
        <div className="text-white/50" style={{ fontSize: 14, fontWeight: 700 }}>—</div>
      ) : (
        <div style={{ fontSize: 14, fontWeight: 800, color: "#F0C97A", textShadow: "0 0 12px rgba(217,164,65,0.45)" }}>
          {value}
        </div>
      )}
      <div className="text-white/65 mt-0.5" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3 }}>
        {source}
      </div>
    </div>
  );
}

export function FloatingCircle({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 flex items-center justify-center text-white ${className}`}
      style={glassStyle(999, "card")}
    >
      {children}
    </button>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between px-5 mt-6 mb-3">
      <div className="text-white" style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4 }}>
        {children}
      </div>
      {action}
    </div>
  );
}
