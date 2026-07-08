"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { SearchBar } from "@/components/SearchBar";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ComingSoonSection } from "@/components/ComingSoonSection";
import { WalletGate } from "@/components/WalletGate";
import { useUsage } from "@/hooks/useUsage";
import { searchAddress } from "@/lib/api-client";
import { ZENERATING } from "@/lib/brand/zenerating";
import type { ApiError } from "@/lib/types";

const FEATURES = [
  { label: "Risk Scoring", desc: "0–100 safety score with factor breakdown" },
  { label: "Token Analysis", desc: "LP, holders, mint authority & more" },
  { label: "Wallet Intel", desc: "Age, balance, activity & tx history" },
];

export default function HomePage() {
  const router = useRouter();
  const { usage, setUsage, refresh } = useUsage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const isAuthenticated = usage?.authenticated ?? false;

  async function handleSearch(address: string) {
    if (!isAuthenticated) {
      return;
    }

    if (usage?.remaining === 0) {
      setUpgradeOpen(true);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await searchAddress(address);

    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      if (result.status === 429) {
        await refresh();
      }
      return;
    }

    if (result.usage) {
      setUsage(result.usage);
    }
    router.push(`/results/${address}?type=${result.data.type}`);
  }

  return (
    <AppShell
      usage={usage}
      onUpgradeClick={() => setUpgradeOpen(true)}
    >
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:pt-24">
        {loading ? (
          <LoadingState message="Resolving address on-chain…" />
        ) : error ? (
          <div className="mx-auto w-full max-w-lg">
            <ErrorState
              error={error}
              onRetry={() => setError(null)}
              onUpgrade={() => setUpgradeOpen(true)}
            />
            <div className="mt-8">
              <SearchBar
                onSearch={handleSearch}
                disabled={usage?.remaining === 0}
                autoFocus
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-3 flex items-center gap-2 rounded-full border border-surface-border bg-surface-raised/60 px-3 py-1 text-xs text-gray-500">
              <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-solana-green" />
              Live Solana mainnet data
            </div>

            <h1 className="max-w-2xl text-center text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {ZENERATING.tagline}
            </h1>
            <p className="mt-4 max-w-lg text-center text-sm leading-relaxed text-gray-500 sm:text-base">
              {ZENERATING.subtagline} Paste a wallet or token mint for risk
              scores, wallet clustering, and calm on-chain clarity.
            </p>

            <div className="mt-6 w-full max-w-2xl">
              <WalletGate authenticated={isAuthenticated} />
            </div>

            <div className="mt-5 w-full max-w-2xl">
              <SearchBar
                onSearch={handleSearch}
                disabled={!isAuthenticated || usage?.remaining === 0}
                autoFocus={isAuthenticated}
              />
            </div>

            {usage?.remaining === 0 && (
              <p className="mt-4 text-center text-sm text-accent-red">
                Daily limit reached.{" "}
                <button
                  type="button"
                  onClick={() => setUpgradeOpen(true)}
                  className="font-medium text-solana-purple hover:underline"
                >
                  Upgrade to continue
                </button>
              </p>
            )}

            <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 xs:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.label} className="crypto-card-hover p-4 text-center sm:p-5">
                  <p className="text-sm font-semibold text-white">{feature.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>

            <ComingSoonSection />
          </div>
        )}
      </main>

      <footer className="border-t border-surface-border/60 py-6 text-center text-xs text-gray-600">
        Powered by Helius · Data cached 12 min · Not financial advice
      </footer>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </AppShell>
  );
}