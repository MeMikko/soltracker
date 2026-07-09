import { ZENERATING } from "@/lib/brand/zenerating";
import { TeaserVisual, type TeaserIcon } from "./teasers/TeaserVisual";

interface RoadmapItem {
  phase: number;
  title: string;
  description: string;
  status: "live" | "soon";
  tier: "free" | "pro";
  accent: string;
  icon: TeaserIcon;
}

const ROADMAP: RoadmapItem[] = [
  {
    phase: 1,
    title: "On-Chain Data Layer",
    description:
      "Helius integration, two-tier cache, risk scoring engine, and MySQL persistence for wallets and tokens.",
    status: "live",
    tier: "free",
    accent: "from-zen-cyan/20 via-transparent to-zen-purple/10",
    icon: "data",
  },
  {
    phase: 2,
    title: "API & Wallet Auth",
    description:
      "REST API routes, wallet-connected freemium limits, and signed-session auth to stop multi-wallet abuse.",
    status: "live",
    tier: "free",
    accent: "from-zen-cyan/15 via-transparent to-accent-blue/10",
    icon: "api",
  },
  {
    phase: 3,
    title: "Search & Risk UI",
    description:
      "Address search, 0–100 risk scores, token and wallet detail cards, and score breakdown on results pages.",
    status: "live",
    tier: "free",
    accent: "from-zen-sage/20 via-transparent to-zen-purple/10",
    icon: "ui",
  },
  {
    phase: 4,
    title: "Creator Funding Network",
    description:
      "Trace who funded the creator, sibling wallets, coordinated buyers, and prior risky deploys.",
    status: "live",
    tier: "pro",
    accent: "from-zen-cyan/25 via-zen-sage/10 to-zen-purple/15",
    icon: "cluster",
  },
  {
    phase: 5,
    title: "Holder Analytics",
    description:
      "Full distribution breakdown — top 10% concentration, Gini coefficient, whale count, and supply metrics.",
    status: "live",
    tier: "pro",
    accent: "from-accent-yellow/15 via-transparent to-transparent",
    icon: "holders",
  },
  {
    phase: 6,
    title: "Deployer Reputation",
    description:
      "Cross-token deployer history. Track creators who repeatedly launch, rug, or build — before you ape in.",
    status: "live",
    tier: "pro",
    accent: "from-zen-purple/20 via-transparent to-solana-green/5",
    icon: "deployer",
  },
  {
    phase: 7,
    title: "Real-Time Alerts",
    description:
      "Get notified when risk changes — mint authority activated, LP pulled, or a top holder dumps.",
    status: "soon",
    tier: "pro",
    accent: "from-accent-red/15 via-transparent to-transparent",
    icon: "alert",
  },
  {
    phase: 8,
    title: "Watchlists & Pro",
    description:
      "Save addresses, track changes over time, and unlock unlimited searches with a Pro subscription.",
    status: "soon",
    tier: "pro",
    accent: "from-zen-cyan/10 via-transparent to-zen-purple/15",
    icon: "watchlist",
  },
  {
    phase: 9,
    title: "Chrome Extension",
    description:
      "Risk scores inline on DexScreener, pump.fun, and explorers — without leaving the page you're on.",
    status: "soon",
    tier: "pro",
    accent: "from-accent-blue/15 via-transparent to-transparent",
    icon: "extension",
  },
  {
    phase: 10,
    title: "AI Intelligence",
    description:
      "Plain-English risk summaries powered by on-chain context. Spot anomalies and rug patterns in seconds.",
    status: "soon",
    tier: "pro",
    accent: "from-zen-sage/15 via-transparent to-zen-cyan/10",
    icon: "ai",
  },
];

const FREE_LIVE_COUNT = ROADMAP.filter(
  (item) => item.status === "live" && item.tier === "free"
).length;
const PRO_LIVE_COUNT = ROADMAP.filter(
  (item) => item.status === "live" && item.tier === "pro"
).length;
const LIVE_COUNT = FREE_LIVE_COUNT + PRO_LIVE_COUNT;
const PROGRESS_PCT = Math.round((LIVE_COUNT / ROADMAP.length) * 100);

function StatusBadge({ item }: { item: RoadmapItem }) {
  if (item.status === "soon") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-zen-purple/25 bg-zen-purple/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zen-purple">
        <span className="h-1.5 w-1.5 rounded-full border border-zen-purple/50" />
        Soon
      </span>
    );
  }

  if (item.tier === "pro") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-zen-purple/35 bg-zen-purple/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zen-purple">
        <span className="h-1.5 w-1.5 rounded-full bg-zen-purple shadow-[0_0_6px_rgba(139,92,246,0.7)]" />
        Pro
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zen-cyan/30 bg-zen-cyan/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zen-cyan">
      <span className="h-1.5 w-1.5 rounded-full bg-zen-cyan shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
      Free
    </span>
  );
}

function TimelineNode({ item }: { item: RoadmapItem }) {
  const shipped = item.status === "live";
  const pro = item.tier === "pro";

  return (
    <span
      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 sm:h-10 sm:w-10 ${
        shipped && pro
          ? "border-zen-purple/60 bg-zen-deep shadow-[0_0_16px_rgba(139,92,246,0.3)]"
          : shipped
            ? "border-zen-cyan/60 bg-zen-deep shadow-[0_0_16px_rgba(34,211,238,0.35)]"
            : "border-zen-purple/30 bg-zen-card"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          shipped && pro
            ? "bg-zen-purple shadow-[0_0_8px_rgba(139,92,246,0.9)]"
            : shipped
              ? "bg-zen-cyan shadow-[0_0_8px_rgba(34,211,238,0.9)]"
              : "bg-zen-purple/40"
        }`}
      />
    </span>
  );
}

function RoadmapCard({ item }: { item: RoadmapItem }) {
  const shipped = item.status === "live";
  const pro = item.tier === "pro";

  return (
    <article
      className={`group relative flex flex-1 flex-col overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
        shipped && pro
          ? "border-zen-purple/25 bg-zen-card/90 hover:border-zen-purple/40 hover:shadow-[0_8px_32px_rgba(139,92,246,0.08)]"
          : shipped
            ? "border-zen-cyan/20 bg-zen-card/90 hover:border-zen-cyan/35 hover:shadow-[0_8px_32px_rgba(34,211,238,0.08)]"
            : "border-zen-border/80 bg-zen-card/60 hover:border-zen-purple/25 hover:bg-zen-card/80"
      }`}
    >
      <div
        className={`relative h-20 overflow-hidden border-b border-zen-border/50 bg-gradient-to-br ${item.accent}`}
      >
        <div className="absolute inset-0 opacity-70 transition-opacity duration-300 group-hover:opacity-100">
          <TeaserVisual icon={item.icon} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zen-card/80 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 font-mono text-[10px] font-medium tracking-wider text-zen-mist/80">
          Phase {String(item.phase).padStart(2, "0")}
        </span>
        <span className="absolute right-3 top-3">
          <StatusBadge item={item} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-sm font-semibold tracking-tight text-white sm:text-base">
          {item.title}
        </h3>
        <p className="mt-2 flex-1 text-xs leading-relaxed text-gray-500 sm:text-[13px]">
          {item.description}
        </p>
      </div>
    </article>
  );
}

export function ComingSoonSection() {
  return (
    <section className="mt-20 w-full max-w-4xl">
      <div className="mb-12 text-center">
        <span className="section-label">Product roadmap</span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <span className="gradient-text">Building with intention</span>
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-500">
          Phases 1–3 are free. Phases 4–6 are live on Pro. Alerts, extension,
          and AI intelligence are next.
        </p>

        <div className="mx-auto mt-8 max-w-md">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              <span className="font-medium text-zen-cyan">{LIVE_COUNT}</span>
              <span className="text-gray-600"> / {ROADMAP.length} phases</span>
            </span>
            <span className="font-mono text-zen-cyan">{PROGRESS_PCT}%</span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-zen-border/60">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-zen-cyan via-zen-sage to-zen-purple shadow-[0_0_12px_rgba(34,211,238,0.4)]"
              style={{ width: `${PROGRESS_PCT}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60"
              style={{ width: `${PROGRESS_PCT}%` }}
            />
          </div>
          <p className="mt-2.5 text-[11px] text-gray-600">
            You are here{" "}
            <span className="text-zen-purple">→ Phase 7 · Real-Time Alerts</span>
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-[11px]">
        <span className="inline-flex items-center gap-2 rounded-full border border-zen-cyan/20 bg-zen-cyan/5 px-3 py-1 text-zen-cyan">
          <span className="h-1.5 w-1.5 rounded-full bg-zen-cyan" />
          {FREE_LIVE_COUNT} free
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-zen-purple/20 bg-zen-purple/5 px-3 py-1 text-zen-purple">
          <span className="h-1.5 w-1.5 rounded-full bg-zen-purple" />
          {PRO_LIVE_COUNT} pro live
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-zen-border/60 bg-zen-card/50 px-3 py-1 text-gray-500">
          {ROADMAP.length - LIVE_COUNT} planned
        </span>
      </div>

      <div className="relative">
        <div
          className="absolute bottom-8 left-[18px] top-8 w-px bg-gradient-to-b from-zen-cyan/60 via-zen-purple/25 to-zen-border/30 sm:left-5"
          aria-hidden
        />

        <div className="space-y-5 sm:space-y-6">
          {ROADMAP.map((item) => (
            <div key={item.phase} className="relative flex gap-4 sm:gap-6">
              <div className="flex w-9 shrink-0 items-start justify-center pt-7 sm:w-10">
                <TimelineNode item={item} />
              </div>
              <div className="min-w-0 flex-1">
                <RoadmapCard item={item} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}