import { useEffect, useState } from "react";
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
import { Sun, Moon } from "lucide-react";
import { ArtworkProvider, DynamicBackdrop } from "./components/wv/artwork";
import { PrefsProvider, usePrefs } from "./components/wv/prefs";
import { LiveDataProvider } from "./services/liveData";
import { apiService, mediaItemToMedia } from "./services/api";

type Stage = "splash" | "onboarding" | "main";
type Overlay = "detail" | "tracker" | "brain" | "settings" | "upcoming" | null;

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
  const theme = prefs.theme;
  const setTheme = (t: "light" | "dark" | "amoled") => update({ theme: t });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme !== "light");
  }, [theme]);

  useEffect(() => {
    if (prefs.onboarded && stage !== "main") setStage("main");
  }, [prefs.onboarded, stage]);

  const openDetail = (m: Media) => {
    setSelected(m);
    setOverlay("detail");
    apiService.getMediaById(m.id)
      .then((item) => setSelected(mediaItemToMedia(item)))
      .catch(() => {
        // Keep the already selected list item if the detail API is unavailable.
      });
  };

  const renderTab = () => {
    switch (tab) {
      case "home":
        return <Home onOpen={openDetail} onNavigate={setTab} />;
      case "discover":
        return <Discover onOpen={openDetail} />;
      case "library":
        return <Library onOpen={openDetail} onDiscover={() => setTab("discover")} />;
      case "calendar":
        return <CalendarScreen />;
      case "profile":
        return (
          <Profile
            onSettings={() => setOverlay("settings")}
            onBrain={() => setOverlay("brain")}
          />
        );
    }
  };

  const appBg = theme === "amoled" ? "#000000" : "#07070a";

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden"
      style={{
        background: appBg,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <button
        onClick={() => setTheme(theme === "amoled" ? "dark" : "amoled")}
        className="fixed top-5 right-5 z-50 w-11 h-11 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white"
        style={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
        aria-label="Toggle theme"
      >
        {theme === "amoled" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="relative w-full h-full overflow-hidden" style={{ background: appBg }}>
        <DynamicBackdrop theme={theme} />

        <AnimatePresence mode="wait">
          {stage === "splash" && (
            <motion.div key="splash" exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0">
              <Splash onDone={() => setStage("onboarding")} />
            </motion.div>
          )}
          {stage === "onboarding" && (
            <motion.div key="onb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
              <Onboarding onDone={() => setStage("main")} />
            </motion.div>
          )}
          {stage === "main" && (
            <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
              {renderTab()}
              <BottomNav active={tab} onChange={setTab} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {overlay === "detail" && selected && (
            <motion.div key="detail" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.25 }} className="absolute inset-0 z-30" style={{ background: "#000" }}>
              <Detail m={selected} onBack={() => setOverlay(null)} onOpenTracker={() => setOverlay("tracker")} />
            </motion.div>
          )}
          {overlay === "tracker" && selected && (
            <motion.div key="tracker" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.25 }} className="absolute inset-0 z-30" style={{ background: "#000" }}>
              <Tracker m={selected} onBack={() => setOverlay("detail")} />
            </motion.div>
          )}
          {overlay === "brain" && (
            <motion.div key="brain" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.25 }} className="absolute inset-0 z-30" style={{ background: "#000" }}>
              <Brain onBack={() => setOverlay(null)} />
            </motion.div>
          )}
          {overlay === "settings" && (
            <motion.div key="settings" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.25 }} className="absolute inset-0 z-30" style={{ background: "#000" }}>
              <SettingsScreen onBack={() => setOverlay(null)} theme={theme} setTheme={setTheme} />
            </motion.div>
          )}
          {overlay === "upcoming" && (
            <motion.div key="upcoming" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.25 }} className="absolute inset-0 z-30" style={{ background: "#000" }}>
              <Upcoming onOpen={openDetail} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
