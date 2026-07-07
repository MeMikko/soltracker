type RoadmapIcon =
  | "data"
  | "api"
  | "ui"
  | "cluster"
  | "holders"
  | "deployer"
  | "alert"
  | "watchlist"
  | "extension"
  | "ai";

interface RoadmapItem {
  phase: number;
  title: string;
  description: string;
  status: "live" | "soon";
  accent: string;
  icon: RoadmapIcon;
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

function TeaserVisual({ icon }: { icon: RoadmapIcon }) {
  switch (icon) {
    case "data":
      return (
        <div className="flex h-full items-center justify-center gap-2 px-3">
          {["Helius", "Cache", "DB"].map((label) => (
            <div
              key={label}
              className="rounded border border-solana-green/20 bg-solana-green/5 px-2 py-1 text-[8px] font-medium text-solana-green"
            >
              {label}
            </div>
          ))}
        </div>
      );
    case "api":
      return (
        <div className="flex h-full flex-col justify-center gap-1 px-3 font-mono text-[8px] text-gray-500">
          <span className="text-solana-green">GET /api/risk/…</span>
          <span>GET /api/token/…</span>
          <span className="text-accent-blue">auth: wallet ✓</span>
        </div>
      );
    case "ui":
      return (
        <div className="flex h-full items-center justify-center gap-3 px-3">
          <div className="text-center">
            <p className="font-mono text-lg font-bold text-solana-green">80</p>
            <p className="text-[7px] uppercase text-gray-600">Score</p>
          </div>
          <div className="h-10 w-px bg-surface-border/60" />
          <div className="space-y-1">
            <div className="h-1.5 w-14 rounded-full bg-solana-green/40" />
            <div className="h-1.5 w-10 rounded-full bg-surface-border/60" />
            <div className="h-1.5 w-12 rounded-full bg-surface-border/40" />
          </div>
        </div>
      );
    case "cluster":
      return (
        <svg viewBox="0 0 120 80" className="h-full w-full" aria-hidden>
          <circle cx="60" cy="40" r="6" fill="currentColor" className="text-solana-purple" />
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const x = 60 + Math.cos(rad) * 28;
            const y = 40 + Math.sin(rad) * 22;
            return (
              <g key={deg}>
                <line
                  x1="60"
                  y1="40"
                  x2={x}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  className="text-solana-purple"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={i % 2 === 0 ? 4 : 3}
                  fill="currentColor"
                  fillOpacity={0.5 + (i % 3) * 0.15}
                  className="text-solana-green"
                />
              </g>
            );
          })}
        </svg>
      );
    case "alert":
      return (
        <div className="flex h-full flex-col justify-center gap-1.5 px-2">
          {[
            { label: "Mint authority activated", tone: "bg-accent-red/60" },
            { label: "LP −42% in 1h", tone: "bg-accent-yellow/50" },
            { label: "Top holder sold 8%", tone: "bg-accent-red/40" },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center gap-2 rounded border border-surface-border/60 bg-surface/40 px-2 py-1"
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.tone}`} />
              <span className="truncate text-[9px] text-gray-500">{row.label}</span>
            </div>
          ))}
        </div>
      );
    case "extension":
      return (
        <div className="relative h-full overflow-hidden rounded-md border border-surface-border/50 bg-surface/50">
          <div className="h-3 border-b border-surface-border/40 bg-surface-raised/80" />
          <div className="p-2">
            <div className="mb-1.5 h-2 w-16 rounded bg-surface-border/60" />
            <div className="flex items-center justify-between rounded border border-solana-green/20 bg-solana-green/5 px-2 py-1">
              <span className="text-[8px] text-gray-500">MENSA</span>
              <span className="font-mono text-[9px] font-semibold text-solana-green">
                80 Safe
              </span>
            </div>
          </div>
          <div className="absolute bottom-1 right-1 rounded bg-gradient-solana px-1.5 py-0.5 text-[7px] font-bold text-surface">
            SI
          </div>
        </div>
      );
    case "ai":
      return (
        <div className="flex h-full flex-col justify-end gap-1 p-2">
          <div className="self-start rounded-lg rounded-bl-none border border-surface-border/50 bg-surface-raised/60 px-2 py-1 text-[8px] leading-snug text-gray-500">
            Summarize risk for this token
          </div>
          <div className="rounded-lg rounded-br-none border border-solana-purple/20 bg-solana-purple/5 px-2 py-1.5 text-[8px] leading-snug text-gray-400">
            <span className="text-solana-green">Low risk.</span> Authorities revoked,
            LP stable. Top holder at 35%.
          </div>
        </div>
      );
    case "holders":
      return (
        <svg viewBox="0 0 120 80" className="h-full w-full px-2" aria-hidden>
          {[72, 48, 35, 22, 15, 10, 6].map((h, i) => (
            <rect
              key={i}
              x={12 + i * 14}
              y={80 - h * 0.7}
              width="10"
              height={h * 0.7}
              rx="2"
              fill="currentColor"
              fillOpacity={0.2 + i * 0.08}
              className="text-accent-yellow"
            />
          ))}
          <line
            x1="8"
            y1="72"
            x2="112"
            y2="72"
            stroke="currentColor"
            strokeOpacity="0.15"
            className="text-gray-500"
          />
        </svg>
      );
    case "deployer":
      return (
        <div className="grid h-full grid-cols-3 gap-1 p-2">
          {[
            { s: "Safe", c: "text-solana-green border-solana-green/20" },
            { s: "Med", c: "text-accent-yellow border-accent-yellow/20" },
            { s: "High", c: "text-accent-red border-accent-red/20" },
            { s: "Safe", c: "text-solana-green border-solana-green/20" },
            { s: "High", c: "text-accent-red border-accent-red/20" },
            { s: "Med", c: "text-accent-yellow border-accent-yellow/20" },
          ].map((cell, i) => (
            <div
              key={i}
              className={`flex items-center justify-center rounded border bg-surface/40 text-[8px] font-medium ${cell.c}`}
            >
              {cell.s}
            </div>
          ))}
        </div>
      );
    case "watchlist":
      return (
        <div className="flex h-full flex-col justify-center gap-1 px-3">
          {["7xKp…pump", "9cRC…pump", "CFPk…pump"].map((addr) => (
            <div
              key={addr}
              className="flex items-center justify-between rounded border border-surface-border/50 bg-surface/40 px-2 py-0.5"
            >
              <span className="font-mono text-[8px] text-gray-500">{addr}</span>
              <span className="text-[8px] text-solana-green">★</span>
            </div>
          ))}
        </div>
      );
  }
}

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