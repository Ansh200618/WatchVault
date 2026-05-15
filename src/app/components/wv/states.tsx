import { WifiOff, AlertTriangle, Search, KeyRound, ImageOff, Inbox } from "lucide-react";

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div
    className="p-8 text-center bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] flex flex-col items-center"
    style={{ borderRadius: 28 }}
  >
    {children}
  </div>
);

const Title = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-3 text-[#111] dark:text-white" style={{ fontSize: 16, fontWeight: 600 }}>{children}</div>
);
const Sub = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-1 text-[#666666] dark:text-[#B8B8B8]" style={{ fontSize: 13, lineHeight: 1.5 }}>{children}</div>
);

const IconBubble = ({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "teal" | "gold" | "error" }) => {
  const bg =
    tone === "teal" ? "bg-[#DDF7F1] dark:bg-[#D9A441]/15"
    : tone === "gold" ? "bg-[#D9A441]/15"
    : tone === "error" ? "bg-[#D94A38]/12"
    : "bg-[#E5E5E5]/60 dark:bg-[#2A2A2A]";
  return <div className={`w-14 h-14 rounded-full flex items-center justify-center ${bg}`}>{children}</div>;
};

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 p-3 bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] animate-pulse"
          style={{ borderRadius: 24 }}
        >
          <div className="w-16 h-20 rounded-2xl bg-[#E5E5E5] dark:bg-[#2A2A2A]" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 rounded-full bg-[#E5E5E5] dark:bg-[#2A2A2A] w-3/4" />
            <div className="h-2.5 rounded-full bg-[#E5E5E5] dark:bg-[#2A2A2A] w-1/2" />
            <div className="h-2.5 rounded-full bg-[#E5E5E5] dark:bg-[#2A2A2A] w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShimmerGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-[#E5E5E5] dark:bg-[#2A2A2A]" style={{ height: 220, borderRadius: 24 }} />
          <div className="h-3 mt-2 rounded-full bg-[#E5E5E5] dark:bg-[#2A2A2A] w-3/4" />
          <div className="h-2.5 mt-1.5 rounded-full bg-[#E5E5E5] dark:bg-[#2A2A2A] w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title = "No title found", subtitle = "Try different keywords or filters." }: { title?: string; subtitle?: string }) {
  return (
    <Wrap>
      <IconBubble><Inbox size={22} className="text-[#666666]" /></IconBubble>
      <Title>{title}</Title>
      <Sub>{subtitle}</Sub>
    </Wrap>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Wrap>
      <IconBubble tone="error"><AlertTriangle size={22} className="text-[#D94A38]" /></IconBubble>
      <Title>Unable to fetch data</Title>
      <Sub>Something went wrong. Please try again.</Sub>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-5 py-2.5 rounded-full bg-[#111] text-white dark:bg-white dark:text-black"
          style={{ fontSize: 12, fontWeight: 600 }}
        >
          Try again
        </button>
      )}
    </Wrap>
  );
}

export function NoInternetState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Wrap>
      <IconBubble><WifiOff size={22} className="text-[#666666]" /></IconBubble>
      <Title>You're offline</Title>
      <Sub>Connect to the internet to fetch the latest titles.</Sub>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-5 py-2.5 rounded-full bg-[#111] text-white dark:bg-white dark:text-black"
          style={{ fontSize: 12, fontWeight: 600 }}
        >
          Retry
        </button>
      )}
    </Wrap>
  );
}

export function ApiKeyMissingState({ apiName }: { apiName: string }) {
  return (
    <Wrap>
      <IconBubble tone="gold"><KeyRound size={22} className="text-[#7A5A1F] dark:text-[#D9A441]" /></IconBubble>
      <Title>{apiName} key required</Title>
      <Sub>Add your {apiName} API key in app settings to load this content.</Sub>
    </Wrap>
  );
}

export function SearchPromptState() {
  return (
    <Wrap>
      <IconBubble tone="teal"><Search size={22} className="text-[#D9A441]" /></IconBubble>
      <Title>Search the catalog</Title>
      <Sub>Find movies, series, and anime across TMDB, AniList, and more.</Sub>
    </Wrap>
  );
}

export function PosterUnavailable({ size = 140, ratio = 1.4 }: { size?: number; ratio?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center bg-[#E5E5E5] dark:bg-[#2A2A2A]"
      style={{ width: size, height: size * ratio, borderRadius: 24 }}
    >
      <ImageOff size={20} className="text-[#9A9388]" />
      <div className="mt-1 text-[#9A9388]" style={{ fontSize: 10 }}>No poster</div>
    </div>
  );
}

export function RatingUnavailable({ source }: { source: string }) {
  return (
    <div
      className="bg-white dark:bg-[#111111] border border-[#E5E5E5] dark:border-[#2A2A2A] p-2 text-center"
      style={{ borderRadius: 16 }}
    >
      <div className="text-[#9A9388]" style={{ fontSize: 14, fontWeight: 700 }}>—</div>
      <div className="text-[#666666] dark:text-[#B8B8B8]" style={{ fontSize: 10 }}>{source}</div>
    </div>
  );
}
