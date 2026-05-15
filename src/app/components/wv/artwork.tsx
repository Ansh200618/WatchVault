import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Dynamic artwork system.
 *
 * Screens push their "current" poster/backdrop URL via useArtwork().set(url).
 * A single DynamicBackdrop component (rendered once in App.tsx) reads the
 * URL, renders it as a heavily blurred, color-rich backdrop and exposes the
 * extracted dominant color so accent chips/glows can adapt.
 *
 * In the real Android app, the equivalent is Palette API on the poster
 * Bitmap returned by the TMDB / AniList image CDN.
 */

type Rgb = { r: number; g: number; b: number };

type ArtworkValue = {
  url: string | null;
  setUrl: (u: string | null) => void;
  color: Rgb;            // dominant RGB extracted from current artwork
  setColor: (c: Rgb) => void;
};

const DEFAULT_COLOR: Rgb = { r: 24, g: 28, b: 36 };

const Ctx = createContext<ArtworkValue>({
  url: null,
  setUrl: () => {},
  color: DEFAULT_COLOR,
  setColor: () => {},
});

export function ArtworkProvider({ children }: { children: React.ReactNode }) {
  const [url, setUrl] = useState<string | null>(null);
  const [color, setColor] = useState<Rgb>(DEFAULT_COLOR);
  const value = useMemo(() => ({ url, setUrl, color, setColor }), [url, color]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useArtwork() {
  return useContext(Ctx);
}

/** Push an artwork URL while this component is mounted. */
export function useSetArtwork(url: string | null | undefined) {
  const { setUrl } = useArtwork();
  useEffect(() => {
    if (url) setUrl(url);
  }, [url, setUrl]);
}

/** Extract a dominant RGB from an image via a tiny offscreen canvas. */
function extractDominant(url: string): Promise<Rgb> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.onload = () => {
      try {
        const size = 20;
        const c = document.createElement("canvas");
        c.width = size;
        c.height = size;
        const ctx = c.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i], pg = data[i + 1], pb = data[i + 2];
          // skip near-black / near-white for richer hue
          const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb);
          if (max < 30 || min > 230) continue;
          r += pr; g += pg; b += pb; n++;
        }
        if (n === 0) return resolve(DEFAULT_COLOR);
        resolve({ r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

/** Hook variant for screens that need the dominant color directly. */
export function useDominantColor(url: string | null | undefined) {
  const [color, setColor] = useState<Rgb>(DEFAULT_COLOR);
  useEffect(() => {
    let cancelled = false;
    if (!url) return;
    extractDominant(url)
      .then((c) => { if (!cancelled) setColor(c); })
      .catch(() => { /* fallback stays default */ });
    return () => { cancelled = true; };
  }, [url]);
  return color;
}

export const rgbToCss = ({ r, g, b }: Rgb, a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`;

/**
 * Renders the global immersive backdrop: blurred poster + adaptive gradient.
 * Sits at the bottom z-layer of the phone frame.
 */
export function DynamicBackdrop({ theme }: { theme: "light" | "dark" | "amoled" }) {
  const { url, setColor, color } = useArtwork();

  const setRef = useCallback(setColor, [setColor]);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    extractDominant(url)
      .then((c) => { if (!cancelled) setRef(c); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [url, setRef]);

  const overlay =
    theme === "light"
      ? "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.85) 100%)"
      : theme === "amoled"
      ? "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%)"
      : "linear-gradient(180deg, rgba(10,10,12,0.55) 0%, rgba(10,10,12,0.85) 100%)";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {url && (
        <div
          key={url}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            backgroundImage: `url(${url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(60px) saturate(140%)",
            transform: "scale(1.4)",
            opacity: 0.85,
          }}
        />
      )}
      {/* color wash from dominant */}
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: `radial-gradient(120% 60% at 50% 0%, ${rgbToCss(color, 0.55)} 0%, transparent 70%), radial-gradient(120% 60% at 50% 100%, ${rgbToCss(color, 0.35)} 0%, transparent 70%)`,
          mixBlendMode: theme === "light" ? "multiply" : "screen",
        }}
      />
      {/* readability overlay */}
      <div className="absolute inset-0" style={{ background: overlay }} />
      {/* subtle film grain for premium feel */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}
