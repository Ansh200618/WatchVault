import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "amoled";

export type UserPrefs = {
  name: string;
  regionCode: string;
  regionName: string;
  languages: string[];
  contentTypes: string[];
  genres: string[];
  remindersEnabled: boolean;
  theme: Theme;
  onboarded: boolean;
};

type Ctx = {
  prefs: UserPrefs;
  update: (p: Partial<UserPrefs>) => void;
  reset: () => void;
};

const DEFAULT: UserPrefs = {
  name: "User",
  regionCode: "IN",
  regionName: "India",
  languages: ["English", "Hindi"],
  contentTypes: ["Movies", "Series", "Anime"],
  genres: [],
  remindersEnabled: false,
  theme: "dark" as Theme,
  onboarded: false,
};

const PrefsCtx = createContext<Ctx>({ prefs: DEFAULT, update: () => {}, reset: () => {} });
const STORAGE_KEY = "watchvault:prefs";

function cleanName(value: unknown): string {
  const name = typeof value === "string" ? value.trim() : "";
  const badNames = ["watcher", "ansb", "ansh", "undefined", "null"];
  if (!name || badNames.includes(name.toLowerCase())) return DEFAULT.name;
  return name;
}

function readPrefs(): UserPrefs {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT;
    const parsed = JSON.parse(stored) as Partial<UserPrefs>;
    return { ...DEFAULT, ...parsed, name: cleanName(parsed.name) };
  } catch {
    return DEFAULT;
  }
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<UserPrefs>(readPrefs);
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const value = useMemo(
    () => ({
      prefs,
      update: (p: Partial<UserPrefs>) => setPrefs((s) => ({ ...s, ...p, name: p.name === undefined ? s.name : cleanName(p.name) })),
      reset: () => setPrefs(DEFAULT),
    }),
    [prefs],
  );
  return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>;
}

export const usePrefs = () => useContext(PrefsCtx);

export const REGIONS = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
];

export const LANGUAGES = [
  "English", "Hindi", "Japanese", "Korean", "Spanish", "French",
  "German", "Tamil", "Telugu", "Malayalam", "Bengali", "Marathi",
];

export const CONTENT_TYPES = ["Movies", "Series", "Anime", "Web Series"];

export const GENRES = [
  "Action", "Comedy", "Thriller", "Horror", "Romance", "Drama",
  "Sci-Fi", "Fantasy", "Mystery", "Crime", "Adventure", "Slice of Life",
];
