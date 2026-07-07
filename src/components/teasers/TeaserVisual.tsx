export type TeaserIcon =
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

export function TeaserVisual({ icon }: { icon: TeaserIcon }) {
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