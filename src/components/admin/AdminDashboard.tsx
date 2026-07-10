"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminFeaturedTokenPanel } from "@/components/admin/AdminFeaturedTokenPanel";
import { AdminWalletWarningsPanel } from "@/components/admin/AdminWalletWarningsPanel";
import { DetailCard } from "@/components/DetailCard";
import { WalletGate } from "@/components/WalletGate";
import { formatNumber, truncateAddress } from "@/lib/format";
import type { AdminAnalytics, ApiError } from "@/lib/types";

interface AdminDashboardProps {
  isAdmin: boolean;
  isAuthenticated: boolean;
}

function formatSol(value: number): string {
  return `${formatNumber(value, 3)} SOL`;
}

function formatDayLabel(date: string): string {
  const [, month, day] = date.split("-");
  return `${month}/${day}`;
}

function DailySearchChart({ data }: { data: AdminAnalytics["dailySearches"] }) {
  const peak = Math.max(...data.map((row) => row.searches), 1);

  return (
    <div className="flex h-40 items-end gap-2 sm:gap-3">
      {data.map((row) => {
        const height = Math.max(8, Math.round((row.searches / peak) * 100));
        return (
          <div
            key={row.date}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <div className="flex h-28 w-full items-end justify-center">
              <div
                className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-zen-cyan/80 to-zen-purple/60"
                style={{ height: `${height}%` }}
                title={`${row.searches} searches`}
              />
            </div>
            <div className="text-center">
              <p className="font-mono text-[10px] text-white">
                {row.searches}
              </p>
              <p className="text-[10px] text-gray-600">
                {formatDayLabel(row.date)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AdminDashboard({
  isAdmin,
  isAuthenticated,
}: AdminDashboardProps) {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const refresh = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/analytics", { credentials: "include" });
      const body = await res.json();

      if (!res.ok) {
        setAnalytics(null);
        setError(body as ApiError);
        return;
      }

      setAnalytics(body as AdminAnalytics);
    } catch {
      setError({
        error: "Failed to load admin analytics",
        code: "INTERNAL",
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!isAuthenticated) {
    return (
      <div className="crypto-card mx-auto w-full max-w-lg p-6 text-center">
        <WalletGate authenticated={false} />
        <p className="mt-4 text-sm text-gray-500">
          Connect an admin wallet to view analytics.
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="crypto-card mx-auto w-full max-w-lg p-6 text-center">
        <p className="text-sm font-semibold text-white">Admin access required</p>
        <p className="mt-2 text-sm text-gray-500">
          This dashboard is only available to configured admin wallets.
        </p>
        <Link href="/" className="btn-ghost mt-6 inline-flex">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zen-cyan">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">Analytics</h1>
          {analytics && (
            <p className="mt-1 text-xs text-gray-600">
              Updated {new Date(analytics.generatedAt).toLocaleString()}
              {!analytics.databaseAvailable && " · database unavailable"}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="btn-ghost px-4 py-2 text-xs disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-accent-red/25 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error.error}
        </div>
      )}

      <AdminFeaturedTokenPanel isAdmin={isAdmin} />
      <AdminWalletWarningsPanel isAdmin={isAdmin} />

      {analytics && (
        <>
          <section>
            <h2 className="section-label mb-3">Usage</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <DetailCard
                label="Searches today"
                value={formatNumber(analytics.overview.searchesToday, 0)}
              />
              <DetailCard
                label="Searches (7d)"
                value={formatNumber(analytics.overview.searchesLast7Days, 0)}
              />
              <DetailCard
                label="Searchers today"
                value={formatNumber(analytics.overview.uniqueSearchersToday, 0)}
              />
              <DetailCard
                label="Searchers (7d)"
                value={formatNumber(
                  analytics.overview.uniqueSearchersLast7Days,
                  0
                )}
              />
            </div>
          </section>

          <section>
            <h2 className="section-label mb-3">Subscriptions & inventory</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <DetailCard
                label="Active Pro"
                value={formatNumber(analytics.overview.activeProSubscriptions, 0)}
              />
              <DetailCard
                label="Active token unlocks"
                value={formatNumber(analytics.overview.activeTokenUnlocks, 0)}
              />
              <DetailCard
                label="Bonus searches left"
                value={formatNumber(
                  analytics.overview.bonusSearchesOutstanding,
                  0
                )}
              />
              <DetailCard
                label="Tracked tokens"
                value={formatNumber(analytics.overview.trackedTokens, 0)}
              />
            </div>
          </section>

          <section>
            <h2 className="section-label mb-3">Revenue</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <DetailCard
                label="Total revenue"
                value={formatSol(analytics.revenue.totalRevenueSol)}
                highlight
              />
              <DetailCard
                label="Pro revenue"
                value={formatSol(analytics.revenue.proRevenueSol)}
              />
              <DetailCard
                label="Search packs"
                value={formatSol(analytics.revenue.searchPackRevenueSol)}
              />
              <DetailCard
                label="Token unlocks"
                value={formatSol(analytics.revenue.tokenUnlockRevenueSol)}
              />
            </div>
          </section>

          <section className="crypto-card p-4 sm:p-6">
            <h2 className="section-label mb-4">Daily searches (7d)</h2>
            <DailySearchChart data={analytics.dailySearches} />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="crypto-card p-4 sm:p-6">
              <h2 className="section-label mb-4">Top searched tokens</h2>
              {analytics.topTokens.length === 0 ? (
                <p className="text-sm text-gray-500">No token searches yet.</p>
              ) : (
                <ul className="space-y-3">
                  {analytics.topTokens.map((token) => (
                    <li
                      key={token.mint}
                      className="flex items-center justify-between gap-3 rounded-xl border border-zen-border/60 bg-zen-card/40 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {token.name ?? token.symbol ?? truncateAddress(token.mint, 4)}
                        </p>
                        <p className="font-mono text-[10px] text-gray-600">
                          {truncateAddress(token.mint, 6)}
                        </p>
                      </div>
                      <p className="shrink-0 text-xs font-medium text-zen-sage">
                        {token.searchCount} searches
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="crypto-card p-4 sm:p-6">
              <h2 className="section-label mb-4">Recent purchases</h2>
              {analytics.recentPurchases.length === 0 &&
              analytics.recentProPayments.length === 0 ? (
                <p className="text-sm text-gray-500">No payments yet.</p>
              ) : (
                <ul className="space-y-3">
                  {analytics.recentProPayments.map((payment) => (
                    <li
                      key={`pro-${payment.wallet}-${payment.paidAt}`}
                      className="rounded-xl border border-zen-border/60 bg-zen-card/40 px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-zen-cyan">Pro</p>
                        <p className="font-mono text-xs text-white">
                          {formatSol(payment.sol)}
                        </p>
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-gray-600">
                        {truncateAddress(payment.wallet, 6)} ·{" "}
                        {new Date(payment.paidAt).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                  {analytics.recentPurchases.map((payment) => (
                    <li
                      key={`${payment.product}-${payment.wallet}-${payment.paidAt}`}
                      className="rounded-xl border border-zen-border/60 bg-zen-card/40 px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-zen-sage">
                          {payment.product === "search_pack"
                            ? "Search pack"
                            : "Token unlock"}
                        </p>
                        <p className="font-mono text-xs text-white">
                          {formatSol(payment.sol)}
                        </p>
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-gray-600">
                        {truncateAddress(payment.wallet, 6)} ·{" "}
                        {new Date(payment.paidAt).toLocaleDateString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section>
            <h2 className="section-label mb-3">Cache footprint</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <DetailCard
                label="Cached tokens"
                value={formatNumber(analytics.overview.cachedTokens, 0)}
              />
              <DetailCard
                label="Cached wallets"
                value={formatNumber(analytics.overview.cachedWallets, 0)}
              />
              <DetailCard
                label="Pro payments"
                value={formatNumber(analytics.revenue.proPaymentsCount, 0)}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}