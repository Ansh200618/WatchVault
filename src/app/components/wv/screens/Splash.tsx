import { useEffect } from "react";
import { motion } from "motion/react";

export function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[#FFFFFF] dark:bg-black">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center"
      >
        <div
          className="w-20 h-20 rounded-3xl bg-[#111] dark:bg-white flex items-center justify-center mb-5"
          style={{ borderRadius: 28 }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 4h16v3l-5 4 5 4v5H4v-5l5-4-5-4V4z"
              stroke="currentColor"
              strokeWidth="1.6"
              className="text-white dark:text-black"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="11" r="1.2" className="fill-[#D9A441]" />
          </svg>
        </div>
        <div className="text-[#111] dark:text-white" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
          WatchVault
        </div>
        <div className="mt-2 text-[#666666] dark:text-[#B8B8B8]" style={{ fontSize: 13 }}>
          Track every story you watch
        </div>
      </motion.div>
      <div className="mt-10 flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#D9A441]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}
