import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Film, CheckCircle2, CalendarClock, MapPin, Bell, Sparkles, ChevronRight, Shuffle, ShieldCheck } from "lucide-react";
import { GlassPanel, GlassButton, GlassChip } from "../glass";
import { usePrefs, REGIONS, LANGUAGES, CONTENT_TYPES, GENRES, type Theme } from "../prefs";
import { requestReminderPermission } from "../../../services/notifications";

type Step =
  | "intro"
  | "name"
  | "region"
  | "language"
  | "content"
  | "genres"
  | "notifications"
  | "theme";

const STEP_ORDER: Step[] = ["intro", "name", "region", "language", "content", "genres", "notifications", "theme"];

const RANDOM_NAMES = [
  "Vault Seeker", "Cine Hunter", "Anime Keeper", "Episode Pilot", "Movie Monk", "Watch Nomad",
  "Series Scout", "Poster Ghost", "Reel Ranger", "Frame Keeper", "Cinema Fox", "Vault Rider",
];

function randomName() {
  return RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
}

const INTRO_SLIDES = [
  { Icon: ShieldCheck, title: "Welcome to WatchVault", sub: "Your cinematic vault for tracking movies, series, anime, episodes, and upcoming releases." },
  { Icon: Film, title: "Track movies, series & anime", sub: "Keep your watch progress organized in one premium library." },
  { Icon: CheckCircle2, title: "Never lose episode progress", sub: "Mark episodes, seasons, and full shows as watched." },
  { Icon: CalendarClock, title: "Get release reminders", sub: "Know when your next movie, episode, or anime season is coming." },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { prefs, update } = usePrefs();
  const [step, setStep] = useState<Step>("intro");
  const [introIdx, setIntroIdx] = useState(0);
  const [name, setName] = useState(prefs.name || randomName());

  const stepIndex = STEP_ORDER.indexOf(step);
  const next = () => {
    const i = stepIndex;
    if (i < STEP_ORDER.length - 1) setStep(STEP_ORDER[i + 1]);
    else {
      update({ onboarded: true });
      onDone();
    }
  };

  const toggleArr = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <div className="h-full flex flex-col px-6 pt-16 pb-8 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 flex-1 mr-3">
          {STEP_ORDER.map((_, idx) => (
            <div
              key={idx}
              className="h-1 flex-1 rounded-full transition-all"
              style={{ background: idx <= stepIndex ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.15)" }}
            />
          ))}
        </div>
        {step !== "intro" && step !== "theme" && (
          <button onClick={next} className="text-white/60" style={{ fontSize: 13 }}>Skip</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={step + (step === "intro" ? introIdx : "")}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {step === "intro" && <IntroPane idx={introIdx} />}
            {step === "name" && <NamePane name={name} setName={setName} />}
            {step === "region" && (
              <RegionPane
                selected={prefs.regionCode}
                onSelect={(code, name) => update({ regionCode: code, regionName: name })}
              />
            )}
            {step === "language" && (
              <LanguagePane
                selected={prefs.languages}
                onToggle={(l) => update({ languages: toggleArr(prefs.languages, l) })}
              />
            )}
            {step === "content" && (
              <ContentPane
                selected={prefs.contentTypes}
                onToggle={(c) => update({ contentTypes: toggleArr(prefs.contentTypes, c) })}
              />
            )}
            {step === "genres" && (
              <GenresPane
                selected={prefs.genres}
                onToggle={(g) => update({ genres: toggleArr(prefs.genres, g) })}
              />
            )}
            {step === "notifications" && (
              <NotificationsPane
                enabled={prefs.remindersEnabled}
                onChange={(v) => update({ remindersEnabled: v })}
              />
            )}
            {step === "theme" && (
              <ThemePane
                selected={prefs.theme}
                onSelect={(t) => update({ theme: t })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pt-4">
        {step === "intro" ? (
          <div className="flex items-center gap-3">
            <div className="flex gap-2 flex-1">
              {INTRO_SLIDES.map((_, idx) => (
                <div
                  key={idx}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: idx === introIdx ? 24 : 6,
                    background: idx === introIdx ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.25)",
                  }}
                />
              ))}
            </div>
            <GlassButton
              variant="primary"
              onClick={() => {
                if (introIdx < INTRO_SLIDES.length - 1) setIntroIdx(introIdx + 1);
                else next();
              }}
            >
              {introIdx < INTRO_SLIDES.length - 1 ? "Next" : "Get Started"} <ChevronRight size={14} />
            </GlassButton>
          </div>
        ) : (
          <GlassButton
            variant="primary"
            className="w-full"
            style={{ width: "100%" }}
            onClick={() => {
              if (step === "name") update({ name: name.trim() || randomName() });
              next();
            }}
          >
            {step === "theme" ? "Enter WatchVault" : "Continue"}
          </GlassButton>
        )}
      </div>
    </div>
  );
}

function PaneHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <div className="text-white" style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
        {title}
      </div>
      {sub && (
        <div className="mt-2 text-white/65" style={{ fontSize: 14, lineHeight: 1.5 }}>{sub}</div>
      )}
    </div>
  );
}

function IntroPane({ idx }: { idx: number }) {
  const { Icon, title, sub } = INTRO_SLIDES[idx];
  return (
    <div className="flex flex-col items-center justify-center text-center pt-6">
      <GlassPanel className="w-56 h-56 flex items-center justify-center mb-10" radius={36}>
        {idx === 0 ? (
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-[28px] bg-white flex items-center justify-center text-black shadow-2xl" style={{ fontSize: 44, fontWeight: 900, letterSpacing: -4 }}>
              WV
            </div>
            <div className="mt-4 text-white" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>WatchVault</div>
          </div>
        ) : (
          <Icon size={72} className="text-white" strokeWidth={1.4} />
        )}
      </GlassPanel>
      <div className="text-white px-4" style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>
        {title}
      </div>
      <div className="mt-3 text-white/70 px-4" style={{ fontSize: 14, lineHeight: 1.5 }}>
        {sub}
      </div>
    </div>
  );
}

function NamePane({ name, setName }: { name: string; setName: (n: string) => void }) {
  return (
    <div>
      <PaneHeader title="What should we call you?" sub="Choose a name or generate a random WatchVault name." />
      <GlassPanel className="px-4 py-3 flex items-center gap-2" radius={20}>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full bg-transparent outline-none text-white placeholder:text-white/40"
          style={{ fontSize: 16, fontWeight: 500 }}
        />
        <button
          type="button"
          onClick={() => setName(randomName())}
          className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white"
          aria-label="Generate random name"
        >
          <Shuffle size={16} />
        </button>
      </GlassPanel>
      <div className="mt-3 text-white/55" style={{ fontSize: 12 }}>
        Leaving it blank will generate a random name automatically.
      </div>
    </div>
  );
}

function RegionPane({ selected, onSelect }: { selected: string; onSelect: (code: string, name: string) => void }) {
  return (
    <div>
      <PaneHeader title="Where do you watch from?" sub="Region decides watch providers, release dates and trending content." />
      <button
        className="w-full mb-4 flex items-center gap-2 px-4 py-3 rounded-full text-white"
        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", fontSize: 13, fontWeight: 600 }}
      >
        <MapPin size={14} /> Detect my region (approximate)
      </button>
      <div className="space-y-2">
        {REGIONS.map((r) => {
          const active = selected === r.code;
          return (
            <button
              key={r.code}
              onClick={() => onSelect(r.code, r.name)}
              className="w-full text-left px-4 py-3 flex items-center justify-between"
              style={{
                borderRadius: 18,
                background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                border: active ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div>
                <div className="text-white" style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                <div className="text-white/55" style={{ fontSize: 11 }}>{r.code}</div>
              </div>
              {active && (
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <CheckCircle2 size={14} className="text-black" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LanguagePane({ selected, onToggle }: { selected: string[]; onToggle: (l: string) => void }) {
  return (
    <div>
      <PaneHeader title="Which languages do you prefer?" sub="Used to filter movies, series and anime recommendations." />
      <div className="flex flex-wrap gap-2">
        {LANGUAGES.map((l) => (
          <GlassChip key={l} active={selected.includes(l)} onClick={() => onToggle(l)}>{l}</GlassChip>
        ))}
      </div>
    </div>
  );
}

function ContentPane({ selected, onToggle }: { selected: string[]; onToggle: (c: string) => void }) {
  return (
    <div>
      <PaneHeader title="What do you watch most?" sub="Tap as many as you'd like — Home adapts to your picks." />
      <div className="grid grid-cols-2 gap-3">
        {CONTENT_TYPES.map((c) => {
          const active = selected.includes(c);
          return (
            <button
              key={c}
              onClick={() => onToggle(c)}
              className="aspect-square flex items-center justify-center text-white p-3"
              style={{
                borderRadius: 24,
                background: active ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.06)",
                border: active ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)",
                fontSize: 16, fontWeight: 600,
              }}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GenresPane({ selected, onToggle }: { selected: string[]; onToggle: (g: string) => void }) {
  return (
    <div>
      <PaneHeader title="Pick your favorite genres" sub="We'll use these for personalized recommendations." />
      <div className="flex flex-wrap gap-2">
        {GENRES.map((g) => (
          <GlassChip key={g} active={selected.includes(g)} onClick={() => onToggle(g)}>{g}</GlassChip>
        ))}
      </div>
    </div>
  );
}

function NotificationsPane({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const enable = async () => {
    if (asking) return;
    setAsking(true);
    const result = await requestReminderPermission();
    onChange(result.enabled);
    setMessage(result.message);
    setAsking(false);
  };

  const later = () => {
    onChange(false);
    setMessage("No problem. You can enable reminders anytime in Settings.");
  };

  return (
    <div>
      <PaneHeader title="Do you want release reminders?" sub="We'll notify you before new movies, episodes and anime seasons drop." />
      <GlassPanel className="p-6 flex flex-col items-center text-center" radius={28}>
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ background: "rgba(217,164,65,0.18)", boxShadow: "0 0 30px rgba(217,164,65,0.35)" }}
        >
          <Bell size={32} className="text-[#D9A441]" />
        </div>
        <div className="text-white" style={{ fontSize: 17, fontWeight: 600 }}>Stay in the loop</div>
        <div className="mt-1 text-white/60" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          You can change this any time in Settings.
        </div>
      </GlassPanel>
      {message && (
        <div className="mt-3 p-3 rounded-2xl bg-white/10 border border-white/15 text-white/80" style={{ fontSize: 12, lineHeight: 1.4 }}>
          {message}
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={later}
          className="py-3 rounded-full text-white"
          style={{
            background: !enabled ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
            border: !enabled ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)",
            fontSize: 13, fontWeight: 600,
          }}
        >
          Maybe Later
        </button>
        <button
          onClick={enable}
          disabled={asking}
          className="py-3 rounded-full disabled:opacity-60"
          style={{
            background: enabled ? "linear-gradient(135deg, #D9A441, #007a68)" : "rgba(255,255,255,0.06)",
            border: enabled ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.12)",
            color: "white",
            boxShadow: enabled ? "0 10px 30px -10px rgba(217,164,65,0.7)" : "none",
            fontSize: 13, fontWeight: 600,
          }}
        >
          {asking ? "Requesting..." : "Enable Reminders"}
        </button>
      </div>
    </div>
  );
}

function ThemePane({ selected, onSelect }: { selected: Theme; onSelect: (t: Theme) => void }) {
  const options: { id: Theme; label: string; sub: string; preview: string }[] = [
    { id: "dark", label: "Dynamic Glass", sub: "Cinematic glass over poster artwork.", preview: "linear-gradient(135deg, #1a1a2e, #0f0f1e)" },
    { id: "amoled", label: "AMOLED Dark", sub: "True black for OLED displays.", preview: "linear-gradient(135deg, #000000, #0a0a0a)" },
  ];
  return (
    <div>
      <PaneHeader title="Choose your app style" sub="You can change this any time in Settings." />
      <div className="space-y-3">
        {options.map((o) => {
          const active = selected === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onSelect(o.id)}
              className="w-full text-left p-3 flex items-center gap-3"
              style={{
                borderRadius: 24,
                background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                border: active ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div
                className="w-14 h-14 flex-shrink-0 flex items-center justify-center"
                style={{ borderRadius: 18, background: o.preview, border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white" style={{ fontSize: 15, fontWeight: 600 }}>{o.label}</div>
                <div className="text-white/60" style={{ fontSize: 12 }}>{o.sub}</div>
              </div>
              {active && (
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-black" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
