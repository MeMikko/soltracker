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
import { ZenLogo } from "@/components/ZenLogo";
import { useUsage } from "@/hooks/useUsage";
import { searchAddress } from "@/lib/api-client";
import { ZENERATING } from "@/lib/brand/zenerating";
import type { ApiError } from "@/lib/types";

const FEATURES = [
  {
    label: "Risk Scoring",
    desc: "Free · 0–100 score with factor breakdown",
    accent: "from-zen-cyan/20 to-transparent",
  },
  {
    label: "Token & Wallet",
    desc: "Free · LP, mint authority, balance & activity",
    accent: "from-zen-purple/20 to-transparent",
  },
  {
    label: "Pro Intelligence",
    desc: "Clustering, holder analytics & deployer history",
    accent: "from-zen-sage/25 to-transparent",
  },
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
    <AppShell usage={usage} onUpgradeClick={() => setUpgradeOpen(true)}>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-8 sm:px-6 sm:pt-12 lg:pt-16">
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
            <div className="mb-6">
              <ZenLogo size="hero" showGlow />
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-full border border-zen-border/60 bg-zen-card/50 px-3.5 py-1.5 text-xs text-gray-500 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-zen-cyan" />
              Live Solana mainnet
            </div>

            <h1 className="max-w-2xl text-center text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              <span className="gradient-text">{ZENERATING.tagline}</span>
            </h1>
            <p className="mt-4 max-w-md text-center text-sm leading-relaxed text-gray-500 sm:text-base">
              {ZENERATING.subtagline}
            </p>

            <div className="crypto-card mt-8 w-full max-w-2xl p-4 sm:p-5">
              <WalletGate authenticated={isAuthenticated} />
              <div className={isAuthenticated ? "mt-4" : ""}>
                <SearchBar
                  onSearch={handleSearch}
                  disabled={
                    !isAuthenticated ||
                    (usage?.tier === "free" && usage.remaining === 0)
                  }
                  autoFocus={isAuthenticated}
                  compact
                />
              </div>
            </div>

            {usage?.tier === "free" && usage.remaining === 0 && isAuthenticated && (
              <p className="mt-4 text-center text-sm text-accent-red">
                Daily free limit reached.{" "}
                <button
                  type="button"
                  onClick={() => setUpgradeOpen(true)}
                  className="font-medium text-zen-cyan hover:underline"
                >
                  Upgrade to Pro
                </button>
              </p>
            )}

            <div className="mt-14 grid w-full max-w-3xl grid-cols-1 gap-4 xs:grid-cols-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.label}
                  className="crypto-card-hover group relative overflow-hidden p-5 text-center"
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${feature.accent} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                    aria-hidden
                  />
                  <p className="relative text-sm font-semibold text-white">
                    {feature.label}
                  </p>
                  <p className="relative mt-1.5 text-xs leading-relaxed text-gray-500">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>

            <ComingSoonSection />
          </div>
        )}
      </main>

      <footer className="border-t border-zen-border/40 py-6 text-center text-xs text-gray-600">
        {ZENERATING.name} · Helius · Cached 12 min · Not financial advice
      </footer>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </AppShell>
  );
}