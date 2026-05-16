import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BottomNav, type Tab } from "./components/wv/BottomNav";
import { Splash } from "./components/wv/screens/Splash";
import { Onboarding } from "./components/wv/screens/Onboarding";
import { Home } from "./components/wv/screens/Home";
import { Discover } from "./components/wv/screens/Discover";
import { Library } from "./components/wv/screens/Library";
import { Upcoming } from "./components/wv/screens/Upcoming";
import { CalendarScreen } from "./components/wv/screens/CalendarScreen";
import { Profile } from "./components/wv/screens/Profile";
import { Detail } from "./components/wv/screens/Detail";
import { Tracker } from "./components/wv/screens/Tracker";
import { Brain } from "./components/wv/screens/Brain";
import { SettingsScreen } from "./components/wv/screens/Settings";
import type { Media } from "./data";
import { ArtworkProvider, DynamicBackdrop } from "./components/wv/artwork";
import { PrefsProvider, usePrefs } from "./components/wv/prefs";
import { LiveDataProvider } from "./services/liveData";
import { apiService, mediaItemToMedia } from "./services/api";

type Stage = "splash" | "onboarding" | "main";
type Overlay = "detail" | "tracker" | "brain" | "settings" | "upcoming" | null;

declare global {
  interface Window {
    __watchvaultShouldExit?: boolean;
  }
}

function mergeProgressFields(fresh: Media, current: Media | null): Media {
  if (!current || fresh.id !== current.id) return fresh;
  return {
    ...fresh,
    status: current.status ?? fresh.status,
    progress: current.progress ?? fresh.progress,
    lastEpisode: current.lastEpisode ?? fresh.lastEpisode,
    watchedEpisodes: (current as any).watchedEpisodes ?? (fresh as any).watchedEpisodes,
  } as Media;
}
export default function App() {
  return (
    <PrefsProvider>
      <ArtworkProvider>
        <LiveDataProvider>
          <AppInner />
        </LiveDataProvider>
      </ArtworkProvider>
    </PrefsProvider>
  );
}

function AppInner() {
  const { prefs, update } = usePrefs();
  const [stage, setStage] = useState<Stage>(prefs.onboarded ? "main" : "splash");
  const [tab, setTab] = useState<Tab>("home");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [selected, setSelected] = useState<Media | null>(null);
  const [exitMessage, setExitMessage] = useState(false);
  const theme = prefs.theme;
  const setTheme = (t: "light" | "dark" | "amoled") => update({ theme: t });

  const stageRef = useRef(stage);
  const tabRef = useRef(tab);
  const overlayRef = useRef(overlay);
  const tabHistoryRef = useRef<Tab[]>([]);
  const lastBackPressRef = useRef(0);
  const allowExitRef = useRef(false);

  useEffect(() => { stageRef.current = stage; }, [stage]);
  useEffect(() => { tabRef.current = tab; }, [tab]);
  useEffect(() => { overlayRef.current = overlay; }, [overlay]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme !== "light");
  }, [theme]);

  useEffect(() => {
    if (prefs.onboarded && stage !== "main") setStage("main");
  }, [prefs.onboarded, stage]);

  const navigateBackInsideApp = (keepInsideApp?: () => void) => {
    window.__watchvaultShouldExit = false;

    if (allowExitRef.current) {
      window.__watchvaultShouldExit = true;
      return;
    }

    if (stageRef.current !== "main") {
      keepInsideApp?.();
      return;
    }

    if (overlayRef.current === "tracker") {
      setOverlay("detail");
      setExitMessage(false);
      keepInsideApp?.();
      return;
    }

    if (overlayRef.current) {
      setOverlay(null);
      setExitMessage(false);
      keepInsideApp?.();
      return;
    }

    const previousTab = tabHistoryRef.current.pop();
    if (previousTab) {
      setTab(previousTab);
      setExitMessage(false);
      keepInsideApp?.();
      return;
    }

    if (tabRef.current !== "home") {
      setTab("home");
      setExitMessage(false);
      keepInsideApp?.();
      return;
    }

    const now = Date.now();
    if (now - lastBackPressRef.current < 2000) {
      allowExitRef.current = true;
      window.__watchvaultShouldExit = true;
      return;
    }

    lastBackPressRef.current = now;
    setExitMessage(true);
    window.setTimeout(() => setExitMessage(false), 2000);
    keepInsideApp?.();
  };

  useEffect(() => {
    window.history.replaceState({ watchVault: true }, document.title);
    window.history.pushState({ watchVault: true }, document.title);

    const keepInsideApp = () => {
      window.history.pushState({ watchVault: true }, document.title);
    };

    const handleBrowserBack = () => {
      navigateBackInsideApp(keepInsideApp);
      if (window.__watchvaultShouldExit) window.history.back();
    };

    const handleNativeBack = () => navigateBackInsideApp();

    window.addEventListener("popstate", handleBrowserBack);
    window.addEventListener("watchvault:native-back", handleNativeBack);
    return () => {
      window.removeEventListener("popstate", handleBrowserBack);
      window.removeEventListener("watchvault:native-back", handleNativeBack);
    };
  }, []);

  const navigateTab = (nextTab: Tab) => {
    setOverlay(null);
    setExitMessage(false);
    setTab((current) => {
      if (current !== nextTab) tabHistoryRef.current.push(current);
      return nextTab;
    });
  };

  const openDetail = (m: Media) => {
    setSelected(m);
    setOverlay("detail");
    setExitMessage(false);
    apiService.getMediaById(m.id)
      .then((item) => {
        const fresh = mediaItemToMedia(item);
        setSelected((current) => mergeProgressFields(fresh, current || m));
      })
      .catch(() => {});
  };

  const updateSelectedProgress = (patch: Partial<Media>) => {
    setSelected((current) => current ? ({ ...current, ...patch } as Media) : current);
  };

  const renderTab = () => {
    switch (tab) {
      case "home": return <Home onOpen={openDetail} onNavigate={navigateTab} />;
      case "discover": return <Discover onOpen={openDetail} />;
      case "library": return <Library onOpen={openDetail} onDiscover={() => navigateTab("discover")} />;
      case "calendar": return <CalendarScreen />;
      case "profile": return <Profile onSettings={() => setOverlay("settings")} onBrain={() => setOverlay("brain")} />;
    }
  };

  const appBg = theme === "amoled" ? "#000000" : "#07070a";

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden"
      style={{
        background: appBg,
        padding: 0,
        margin: 0,
      }}
    >
      <div className="relative w-full h-full overflow-hidden" style={{ background: appBg }}>
        <DynamicBackdrop theme={theme} />

        <AnimatePresence mode="wait">
          {stage === "splash" && <motion.div key="splash" exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0"><Splash onDone={() => setStage("onboarding")} /></motion.div>}
          {stage === "onboarding" && <motion.div key="onb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0"><Onboarding onDone={() => setStage("main")} /></motion.div>}
          {stage === "main" && <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">{renderTab()}<BottomNav active={tab} onChange={navigateTab} /></motion.div>}
        </AnimatePresence>

        <AnimatePresence>
          {overlay === "detail" && selected && <motion.div key="detail" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.25 }} className="absolute inset-0 z-30" style={{ background: "#000" }}><Detail m={selected} onBack={() => setOverlay(null)} onOpenTracker={() => setOverlay("tracker")} /></motion.div>}
          {overlay === "tracker" && selected && <motion.div key="tracker" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.25 }} className="absolute inset-0 z-30" style={{ background: "#000" }}><Tracker m={selected} onBack={() => setOverlay("detail")} onProgressChange={updateSelectedProgress} /></motion.div>}
          {overlay === "brain" && <motion.div key="brain" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.25 }} className="absolute inset-0 z-30" style={{ background: "#000" }}><Brain onBack={() => setOverlay(null)} /></motion.div>}
          {overlay === "settings" && <motion.div key="settings" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.25 }} className="absolute inset-0 z-30" style={{ background: "#000" }}><SettingsScreen onBack={() => setOverlay(null)} theme={theme} setTheme={setTheme} /></motion.div>}
          {overlay === "upcoming" && <motion.div key="upcoming" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.25 }} className="absolute inset-0 z-30" style={{ background: "#000" }}><Upcoming onOpen={openDetail} /></motion.div>}
        </AnimatePresence>

        <AnimatePresence>
          {exitMessage && (
            <motion.div
              key="exit-toast"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute left-5 right-5 z-50 rounded-2xl bg-white/95 px-4 py-3 text-center text-black shadow-2xl"
              style={{ fontSize: 13, fontWeight: 800, bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
            >
              Press back again to exit
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}