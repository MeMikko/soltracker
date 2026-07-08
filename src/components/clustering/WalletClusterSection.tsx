"use client";

import { useEffect, useState } from "react";
import { fetchCluster } from "@/lib/api-client";
import { ZENERATING, ZEN_BRAND } from "@/lib/brand/zenerating";
import type { ClusterGraph } from "@/lib/clustering/types";
import type { ApiError } from "@/lib/types";
import { WalletClusterGraph } from "./WalletClusterGraph";

interface WalletClusterSectionProps {
  address: string;
}

export function WalletClusterSection({ address }: WalletClusterSectionProps) {
  const [graph, setGraph] = useState<ClusterGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const result = await fetchCluster(address);
      if (cancelled) return;

      if (!result.ok) {
        setError(result.error);
        setGraph(null);
      } else {
        setGraph(result.data);
      }

      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [address]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zen-sage">
            {ZENERATING.name} · Phase 4
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">
            {ZEN_BRAND.voice.clusterTitle}
          </h3>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-500">
            {ZEN_BRAND.voice.clusterSubtitle}
          </p>
        </div>
        {graph && (
          <div className="flex gap-2 text-[10px] text-gray-500">
            <StatPill label="Nodes" value={graph.nodes.length} />
            <StatPill label="Links" value={graph.edges.length} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex h-[420px] items-center justify-center rounded-xl border border-zen-border bg-zen-deep sm:h-[480px]">
          <p className="text-sm text-zen-mist">{ZEN_BRAND.voice.loadingCluster}</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-accent-red/20 bg-accent-red/5 px-4 py-6 text-center text-sm text-accent-red">
          {error.error}
        </div>
      ) : graph && graph.edges.length > 0 ? (
        <WalletClusterGraph graph={graph} />
      ) : (
        <div className="rounded-xl border border-zen-border bg-zen-deep px-4 py-10 text-center text-sm text-gray-500">
          {ZEN_BRAND.voice.emptyCluster}
        </div>
      )}
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-zen-border bg-zen-card px-2.5 py-1">
      {label}{" "}
      <span className="font-mono text-gray-300">{value}</span>
    </span>
  );
}