"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { FeaturedToken } from "@/components/FeaturedToken";
import { RecentTokensList } from "@/components/RecentTokensList";
import { SearchBar } from "@/components/SearchBar";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ComingSoonSection } from "@/components/ComingSoonSection";
import { WalletGate } from "@/components/WalletGate";
import { ZenLogo } from "@/components/ZenLogo";
import { useUsage } from "@/hooks/useUsage";
import { searchAddress } from "@/lib/api-client";
import { ZENERATING } from "@/lib/brand/zenerating";
import type { ApiError } from "@/lib/types";

const FEATURE_CARD_CLASS =
  "flex h-full flex-col items-center gap-2 rounded-xl border border-zen-border/70 bg-zen-card/60 px-3 py-4 text-center transition-all hover:border-zen-cyan/30 hover:bg-zen-card hover:shadow-[0_4px_20px_rgba(34,211,238,0.08)]";

const FEATURES = [
  {
    label: "Risk Scoring",
    desc: "Free · 0–100 score with factor breakdown",
    abbr: "RS",
    iconClass: "bg-zen-cyan/15 text-zen-cyan",
  },
  {
    label: "Token & Wallet",
    desc: "Free · LP, mint authority, balance & activity",
    abbr: "TW",
    iconClass: "bg-solana-purple/15 text-solana-purple",
  },
  {
    label: "Pro Intelligence",
    desc: "Clustering, holder analytics & deployer history",
    abbr: "PI",
    iconClass: "bg-zen-sage/15 text-zen-sage",
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

            <div className="crypto-card mt-8 w-full max-w-6xl p-4 sm:p-5">
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

            <FeaturedToken />
            <RecentTokensList />

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

            <div className="mt-14 grid w-full max-w-4xl grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.label} className={FEATURE_CARD_CLASS}>
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zen-border/80 text-xs font-bold ${feature.iconClass}`}
                  >
                    {feature.abbr}
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="truncate text-sm font-medium text-white">
                      {feature.label}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-relaxed text-gray-600">
                      {feature.desc}
                    </p>
                  </div>
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