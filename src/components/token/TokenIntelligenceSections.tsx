"use client";

import { useEffect, useState } from "react";
import { fetchTokenAnalytics } from "@/lib/api-client";
import type { TokenAnalytics } from "@/lib/data/token-analytics-service";
import type { ApiError } from "@/lib/types";
import { ProLockedOverlay } from "../ProLockedOverlay";
import { TokenComingSoonSections } from "../teasers/ComingSoonTeaser";
import { DeployerReputationSection } from "./DeployerReputationSection";
import { HolderAnalyticsSection } from "./HolderAnalyticsSection";

interface TokenIntelligenceSectionsProps {
  mint: string;
  isPro: boolean;
  onUpgrade: () => void;
  onUnlockToken?: () => void;
}

function AnalyticsPreview() {
  return (
    <div className="grid grid-cols-2 gap-3 p-6 md:grid-cols-4">
      {["Top 10", "Gini", "Whales", "Top 50%"].map((label) => (
        <div
          key={label}
          className="rounded-xl border border-zen-border/60 bg-zen-card/80 px-3 py-4 text-center"
        >
          <p className="text-[10px] uppercase tracking-wider text-gray-600">
            {label}
          </p>
          <p className="mt-2 font-mono text-lg text-gray-400">██.█%</p>
        </div>
      ))}
    </div>
  );
}

function DeployerPreview() {
  return (
    <div className="space-y-3 p-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full border border-zen-border bg-zen-card" />
        <div className="space-y-2">
          <div className="h-3 w-32 rounded bg-zen-border/80" />
          <div className="h-3 w-48 rounded bg-zen-border/60" />
        </div>
      </div>
      <div className="h-20 rounded-xl border border-zen-border/60 bg-zen-card/60" />
    </div>
  );
}

export function TokenIntelligenceSections({
  mint,
  isPro,
  onUpgrade,
  onUnlockToken,
}: TokenIntelligenceSectionsProps) {
  const [analytics, setAnalytics] = useState<TokenAnalytics | null>(null);
  const [loading, setLoading] = useState(isPro);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!isPro) {
      setAnalytics(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const result = await fetchTokenAnalytics(mint);
      if (cancelled) return;

      if (!result.ok) {
        setError(result.error);
        setAnalytics(null);
      } else {
        setAnalytics(result.data);
      }

      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [mint, isPro]);

  if (!isPro) {
    return (
      <div className="space-y-8">
        <ProLockedOverlay
          onUpgrade={onUpgrade}
          onUnlockToken={onUnlockToken}
          title="Holder Analytics"
          description="Top holder concentration, Gini coefficient, and whale exposure — Pro or per-token unlock."
        >
          <AnalyticsPreview />
        </ProLockedOverlay>

        <ProLockedOverlay
          onUpgrade={onUpgrade}
          onUnlockToken={onUnlockToken}
          title="Deployer Reputation"
          description="Cross-token deploy history and rug-risk signals — Pro or per-token unlock."
        >
          <DeployerPreview />
        </ProLockedOverlay>

        <TokenComingSoonSections isPro={false} onUpgrade={onUpgrade} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <HolderAnalyticsSection
        data={analytics?.holders ?? null}
        loading={loading}
        error={error}
      />
      <DeployerReputationSection
        data={analytics?.deployer ?? null}
        loading={loading}
        error={error}
      />
      <TokenComingSoonSections isPro onUpgrade={onUpgrade} />
    </div>
  );
}