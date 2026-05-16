import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark" | "amoled";

export type UserPrefs = {
  userId: string;
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

const STORAGE_KEY = "watchvault:prefs";

function createUserId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `wv_${crypto.randomUUID()}`;
  }
  return `wv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function makeDefaultPrefs(): UserPrefs {
  return {
    userId: createUserId(),
    name: "",
    regionCode: "IN",
    regionName: "India",
    languages: ["English", "Hindi"],
    contentTypes: ["Movies", "Series", "Anime"],
    genres: [],
    remindersEnabled: false,
    theme: "dark" as Theme,
    onboarded: false,
  };
}

const DEFAULT: UserPrefs = makeDefaultPrefs();
const PrefsCtx = createContext<Ctx>({ prefs: DEFAULT, update: () => {}, reset: () => {} });

function cleanName(value: unknown): string {
  const name = typeof value === "string" ? value.trim() : "";
  const blockedPlaceholders = ["watcher", "user", "undefined", "null"];
  if (!name || blockedPlaceholders.includes(name.toLowerCase())) return "";
  return name;
}

function readPrefs(): UserPrefs {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return makeDefaultPrefs();
    const parsed = JSON.parse(stored) as Partial<UserPrefs>;
    return { ...makeDefaultPrefs(), ...parsed, userId: parsed.userId || createUserId(), name: cleanName(parsed.name) };
  } catch {
    return makeDefaultPrefs();
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
      update: (p: Partial<UserPrefs>) => setPrefs((s) => ({ ...s, ...p, userId: p.userId || s.userId, name: p.name === undefined ? s.name : cleanName(p.name) })),
      reset: () => setPrefs({ ...makeDefaultPrefs(), userId: prefs.userId }),
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