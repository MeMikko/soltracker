"use client";

import { ZENERATING } from "@/lib/brand/zenerating";
import { formatNumber, truncateAddress } from "@/lib/format";
import type { ApiError } from "@/lib/types";
import type { HolderAnalytics } from "@/lib/token/holder-analytics";
import { DetailCard } from "../DetailCard";

interface HolderAnalyticsSectionProps {
  data: HolderAnalytics | null;
  loading: boolean;
  error: ApiError | null;
}

function giniLabel(gini: number): string {
  if (gini >= 0.75) return "Highly concentrated";
  if (gini >= 0.55) return "Moderately concentrated";
  if (gini >= 0.35) return "Balanced spread";
  return "Wide distribution";
}

export function HolderAnalyticsSection({
  data,
  loading,
  error,
}: HolderAnalyticsSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zen-sage">
          {ZENERATING.name} · Phase 5
        </p>
        <h3 className="mt-1 text-base font-semibold text-white">
          Holder Analytics
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Supply concentration, Gini coefficient, and whale exposure for this
          token.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-zen-border bg-zen-deep px-4 py-10 text-center text-sm text-zen-mist">
          Analyzing holder distribution…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-accent-red/20 bg-accent-red/5 px-4 py-6 text-center text-sm text-accent-red">
          {error.error}
        </div>
      ) : data ? (
        <>
          {data.sampled && (
            <p className="text-[11px] text-gray-600">
              Large holder base — metrics estimated from top on-chain accounts.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <DetailCard
              label="Top 10 holders"
              value={`${formatNumber(data.distribution.top10Percent, 1)}%`}
              highlight={data.distribution.top10Percent > 35}
            />
            <DetailCard
              label="Top 50% supply"
              value={`${formatNumber(data.distribution.top50Percent, 1)}%`}
            />
            <DetailCard
              label="Gini coefficient"
              value={data.distribution.giniCoefficient.toFixed(3)}
              highlight={data.distribution.giniCoefficient >= 0.65}
            />
            <DetailCard
              label="Whales (≥1%)"
              value={formatNumber(data.distribution.whaleCount, 0)}
              highlight={data.distribution.whaleCount >= 3}
            />
          </div>

          <div className="rounded-xl border border-zen-border/80 bg-zen-deep/60 px-4 py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Distribution shape</span>
              <span className="text-zen-mist">
                {giniLabel(data.distribution.giniCoefficient)}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zen-border/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-zen-cyan via-zen-sage to-zen-purple"
                style={{
                  width: `${Math.min(100, data.distribution.giniCoefficient * 100)}%`,
                }}
              />
            </div>
          </div>

          {data.topHolders.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-zen-border/80">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zen-border/70 bg-zen-card/80 text-[10px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">#</th>
                    <th className="px-3 py-2.5 font-medium">Wallet</th>
                    <th className="px-3 py-2.5 font-medium text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topHolders.map((holder) => (
                    <tr
                      key={`${holder.rank}-${holder.owner}`}
                      className="border-b border-zen-border/40 last:border-0"
                    >
                      <td className="px-3 py-2.5 text-gray-500">{holder.rank}</td>
                      <td className="px-3 py-2.5 font-mono text-zen-mist">
                        {truncateAddress(holder.owner, 6)}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right font-mono ${
                          holder.percent >= 5
                            ? "text-accent-yellow"
                            : "text-gray-300"
                        }`}
                      >
                        {formatNumber(holder.percent, 1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}