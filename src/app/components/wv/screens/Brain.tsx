import { ArrowLeft, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLiveData } from "../../../services/liveData";

export function Brain({ onBack }: { onBack: () => void }) {
  const { insights } = useLiveData();
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="h-full overflow-y-auto pb-28 ">
      <div className="px-5 pt-12 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-center justify-center">
          <ArrowLeft size={16} className="text-[#111] dark:text-white" />
        </button>
        <div>
          <div className="text-[#111] dark:text-white" style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
            Watch Brain
          </div>
          <div className="text-[#666666]" style={{ fontSize: 12 }}>
            Smart insights tailored for you
          </div>
        </div>
      </div>
      {message && (
        <div className="mx-5 mt-4 p-3 rounded-2xl bg-[#D9A441]/15 text-[#7A5A1F] dark:text-[#D9A441]" style={{ fontSize: 12, fontWeight: 600 }}>
          {message}
        </div>
      )}
      <div className="px-5 mt-5 space-y-3">
        {insights.map((i, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex items-start gap-3"
            style={{ borderRadius: 24 }}
          >
            <div className="w-11 h-11 rounded-full bg-[#D9A441]/15 flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-[#D9A441]" />
            </div>
            <div className="flex-1">
              <div className="text-[#111] dark:text-white" style={{ fontSize: 14, fontWeight: 600 }}>
                {i.text}
              </div>
              <button
                onClick={() => setMessage(`${i.action} queued from Watch Brain`)}
                className="mt-3 px-4 py-1.5 rounded-full bg-[#111] text-white dark:bg-white dark:text-black"
                style={{ fontSize: 11, fontWeight: 600 }}
              >
                {i.action}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
