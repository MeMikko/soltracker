import { TeaserVisual, type TeaserIcon } from "./teasers/TeaserVisual";

interface RoadmapItem {
  phase: number;
  title: string;
  description: string;
  status: "live" | "soon";
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
    accent: "from-solana-green/25 to-solana-green/5",
    icon: "data",
  },
  {
    phase: 2,
    title: "API & Wallet Auth",
    description:
      "REST API routes, wallet-connected freemium limits, and signed-session auth to stop multi-wallet abuse.",
    status: "live",
    accent: "from-solana-green/20 to-accent-blue/5",
    icon: "api",
  },
  {
    phase: 3,
    title: "Search & Risk UI",
    description:
      "Address search, 0–100 risk scores, token and wallet detail cards, and score breakdown on results pages.",
    status: "live",
    accent: "from-solana-green/15 to-solana-purple/5",
    icon: "ui",
  },
  {
    phase: 4,
    title: "Wallet Clustering",
    description:
      "Trace fund flows and map wallet networks. See which addresses move together and fund new mints.",
    status: "soon",
    accent: "from-solana-purple/40 to-solana-purple/5",
    icon: "cluster",
  },
  {
    phase: 5,
    title: "Holder Analytics",
    description:
      "Full distribution breakdown — top 10% concentration, Gini coefficient, whale count, and supply metrics.",
    status: "soon",
    accent: "from-accent-yellow/25 to-accent-yellow/5",
    icon: "holders",
  },
  {
    phase: 6,
    title: "Deployer Reputation",
    description:
      "Cross-token deployer history. Track creators who repeatedly launch, rug, or build — before you ape in.",
    status: "soon",
    accent: "from-solana-purple/25 to-solana-green/10",
    icon: "deployer",
  },
  {
    phase: 7,
    title: "Real-Time Alerts",
    description:
      "Get notified when risk changes — mint authority activated, LP pulled, or a top holder dumps.",
    status: "soon",
    accent: "from-accent-red/30 to-accent-red/5",
    icon: "alert",
  },
  {
    phase: 8,
    title: "Watchlists & Pro",
    description:
      "Save addresses, track changes over time, and unlock unlimited searches with a Pro subscription.",
    status: "soon",
    accent: "from-accent-blue/25 to-solana-purple/5",
    icon: "watchlist",
  },
  {
    phase: 9,
    title: "Chrome Extension",
    description:
      "Risk scores inline on DexScreener, pump.fun, and explorers — without leaving the page you're on.",
    status: "soon",
    accent: "from-accent-blue/30 to-accent-blue/5",
    icon: "extension",
  },
  {
    phase: 10,
    title: "AI Intelligence",
    description:
      "Plain-English risk summaries powered by on-chain context. Spot anomalies and rug patterns in seconds.",
    status: "soon",
    accent: "from-solana-green/30 to-solana-green/5",
    icon: "ai",
  },
];

const LIVE_COUNT = ROADMAP.filter((item) => item.status === "live").length;

function StatusBadge({ status }: { status: RoadmapItem["status"] }) {
  if (status === "live") {
    return (
      <span className="rounded-full border border-solana-green/30 bg-solana-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-solana-green">
        Live
      </span>
    );
  }

  return (
    <span className="rounded-full border border-solana-purple/20 bg-solana-purple/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-solana-purple">
      Soon
    </span>
  );
}

export function ComingSoonSection() {
  const progressPct = Math.round((LIVE_COUNT / ROADMAP.length) * 100);

  return (
    <section className="mt-20 w-full max-w-5xl">
      <div className="mb-8 text-center">
        <span className="section-label text-solana-purple/80">Roadmap</span>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
          Product Roadmap
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-gray-600 sm:text-sm">
          Phases 1–3 are live today. Phases 4–10 are in active development —
          clustering, alerts, extension, and AI intelligence on the way.
        </p>

        <div className="mx-auto mt-5 max-w-sm">
          <div className="mb-1.5 flex justify-between text-[10px] text-gray-600">
            <span>
              Phase {LIVE_COUNT} of {ROADMAP.length} shipped
            </span>
            <span className="text-solana-green">{progressPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-border/60">
            <div
              className="h-full rounded-full bg-gradient-solana transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] text-gray-600">
            You are here → building Phase 4
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROADMAP.map((item) => (
          <article
            key={item.phase}
            className={`group flex flex-col overflow-hidden rounded-xl border bg-surface-card shadow-card transition-all ${
              item.status === "live"
                ? "border-solana-green/20 hover:border-solana-green/35"
                : "border-surface-border hover:border-solana-purple/30 hover:shadow-glow-sm"
            }`}
          >
            <div
              className={`relative h-24 bg-gradient-to-br ${item.accent} border-b border-surface-border/40`}
            >
              <div
                className={`absolute inset-0 transition-opacity group-hover:opacity-100 ${
                  item.status === "live" ? "opacity-90" : "opacity-80"
                }`}
              >
                <TeaserVisual icon={item.icon} />
              </div>
              <span className="absolute left-3 top-3 rounded-full border border-surface-border/60 bg-surface/70 px-2 py-0.5 font-mono text-[10px] font-medium text-gray-400">
                {item.phase}
              </span>
              <span className="absolute right-3 top-3">
                <StatusBadge status={item.status} />
              </span>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="mt-1.5 flex-1 text-xs leading-relaxed text-gray-500">
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}