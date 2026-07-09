"use client";

import { useEffect, useState } from "react";
import { fetchTokenAnalytics } from "@/lib/api-client";
import type { TokenAnalytics } from "@/lib/data/token-analytics-service";
import type { ApiError } from "@/lib/types";
import { TokenComingSoonSections } from "../teasers/ComingSoonTeaser";
import { DeployerReputationSection } from "./DeployerReputationSection";
import { HolderAnalyticsSection } from "./HolderAnalyticsSection";

interface TokenIntelligenceSectionsProps {
  mint: string;
}

export function TokenIntelligenceSections({
  mint,
}: TokenIntelligenceSectionsProps) {
  const [analytics, setAnalytics] = useState<TokenAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
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
  }, [mint]);

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
      <TokenComingSoonSections />
    </div>
  );
}