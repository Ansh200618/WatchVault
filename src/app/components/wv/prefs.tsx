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
};

const DEFAULT: UserPrefs = {
  name: "Watcher",
  regionCode: "IN",
  regionName: "India",
  languages: ["English"],
  contentTypes: ["Movies"],
  genres: [],
  remindersEnabled: false,
  theme: "dark" as Theme,
  onboarded: false,
};

const PrefsCtx = createContext<Ctx>({ prefs: DEFAULT, update: () => {} });
const STORAGE_KEY = "watchvault:prefs";

function readPrefs(): UserPrefs {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT, ...JSON.parse(stored) } : DEFAULT;
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
    () => ({ prefs, update: (p: Partial<UserPrefs>) => setPrefs((s) => ({ ...s, ...p })) }),
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
