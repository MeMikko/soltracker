"use client";

import type { UsageResponse } from "@/lib/types";

interface UsageCounterProps {
  usage: UsageResponse | null;
  onUpgradeClick?: () => void;
}

export function UsageCounter({ usage, onUpgradeClick }: UsageCounterProps) {
  if (!usage) return null;

  if (!usage.authenticated) {
    return (
      <span className="text-xs text-gray-500 sm:text-sm">
        Wallet required
      </span>
    );
  }

  if (usage.tier === "admin") {
    return (
      <div
        className="flex items-center gap-2 rounded-full border border-zen-sage/30 bg-zen-sage/10 px-3 py-1.5 text-xs text-zen-sage sm:text-sm"
        data-testid="usage-counter"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zen-sage animate-pulse-glow" />
        <span className="whitespace-nowrap font-medium">Admin · unlimited</span>
      </div>
    );
  }

  if (usage.tier === "pro") {
    const until = usage.proExpiresAt
      ? new Date(usage.proExpiresAt).toLocaleDateString()
      : null;

    return (
      <div
        className="flex items-center gap-2 rounded-full border border-zen-sage/30 bg-zen-sage/10 px-3 py-1.5 text-xs text-zen-sage sm:text-sm"
        data-testid="usage-counter"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zen-sage animate-pulse-glow" />
        <span className="whitespace-nowrap font-medium">
          Pro · unlimited{until ? ` · until ${until}` : ""}
        </span>
      </div>
    );
  }

  const atLimit = usage.remaining === 0;
  const pct = Math.round((usage.remaining / usage.limit) * 100);

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div
        className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:text-sm ${
          atLimit
            ? "border-accent-red/30 bg-accent-red/10 text-accent-red"
            : "border-surface-border bg-surface-raised/80 text-gray-400"
        }`}
        data-testid="usage-counter"
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            atLimit ? "bg-accent-red" : "bg-solana-green animate-pulse-glow"
          }`}
        />
        <span className="whitespace-nowrap">
          {usage.remaining}/{usage.limit} searches
        </span>
        {!atLimit && (
          <span className="hidden text-gray-600 sm:inline">
            · {pct}% left
          </span>
        )}
      </div>
      {atLimit && onUpgradeClick && (
        <button
          type="button"
          onClick={onUpgradeClick}
          className="btn-primary shrink-0 px-3 py-1.5 text-xs"
        >
          Upgrade
        </button>
      )}
    </div>
  );
}