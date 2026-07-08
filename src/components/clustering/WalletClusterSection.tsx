"use client";

import { useEffect, useState } from "react";
import { fetchCluster, fetchTokenCreatorCluster } from "@/lib/api-client";
import { ZENERATING, ZEN_BRAND } from "@/lib/brand/zenerating";
import type { ClusterContext, ClusterGraph } from "@/lib/clustering/types";
import type { ApiError } from "@/lib/types";
import { truncateAddress } from "@/lib/format";
import { WalletClusterGraph } from "./WalletClusterGraph";

interface WalletClusterSectionProps {
  address: string;
  context?: ClusterContext;
  creatorAddress?: string | null;
  tokenSymbol?: string | null;
}

export function WalletClusterSection({
  address,
  context = "wallet",
  creatorAddress,
  tokenSymbol,
}: WalletClusterSectionProps) {
  const [graph, setGraph] = useState<ClusterGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const isTokenCreator = context === "token_creator";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      if (isTokenCreator && !creatorAddress) {
        setError({
          error: ZEN_BRAND.voice.noCreator,
          code: "NOT_FOUND",
        });
        setGraph(null);
        setLoading(false);
        return;
      }

      const result = isTokenCreator
        ? await fetchTokenCreatorCluster(address)
        : await fetchCluster(address);

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
  }, [address, context, creatorAddress, isTokenCreator]);

  const title = isTokenCreator
    ? ZEN_BRAND.voice.creatorClusterTitle
    : ZEN_BRAND.voice.clusterTitle;

  const subtitle = isTokenCreator
    ? ZEN_BRAND.voice.creatorClusterSubtitle
    : ZEN_BRAND.voice.clusterSubtitle;

  const loadingMessage = isTokenCreator
    ? ZEN_BRAND.voice.loadingCreatorCluster
    : ZEN_BRAND.voice.loadingCluster;

  const emptyMessage = isTokenCreator
    ? ZEN_BRAND.voice.emptyCreatorCluster
    : ZEN_BRAND.voice.emptyCluster;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zen-sage">
            {ZENERATING.name} · Phase 4
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">{title}</h3>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-gray-500">
            {subtitle}
          </p>
          {isTokenCreator && creatorAddress && (
            <p className="mt-2 font-mono text-[10px] text-zen-mist">
              Creator{" "}
              <span className="text-gray-400">
                {truncateAddress(creatorAddress, 6)}
              </span>
              {tokenSymbol ? (
                <>
                  {" "}
                  · Token <span className="text-gray-400">{tokenSymbol}</span>
                </>
              ) : null}
            </p>
          )}
        </div>
        {graph && (
          <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
            <StatPill label="Nodes" value={graph.nodes.length} />
            <StatPill label="Links" value={graph.edges.length} />
            {isTokenCreator && graph.meta.coordinatedBuyers != null && (
              <StatPill
                label="Coordinated buyers"
                value={graph.meta.coordinatedBuyers}
                highlight={graph.meta.coordinatedBuyers >= 2}
              />
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex h-[420px] items-center justify-center rounded-xl border border-zen-border bg-zen-deep sm:h-[480px]">
          <p className="text-sm text-zen-mist">{loadingMessage}</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-accent-red/20 bg-accent-red/5 px-4 py-6 text-center text-sm text-accent-red">
          {error.error}
        </div>
      ) : graph && graph.edges.length > 0 ? (
        <>
          {isTokenCreator &&
            graph.meta.funderAlerts &&
            graph.meta.funderAlerts.length > 0 && (
              <FunderAlertsPanel alerts={graph.meta.funderAlerts} />
            )}
          <WalletClusterGraph graph={graph} />
        </>
      ) : (
        <div className="rounded-xl border border-zen-border bg-zen-deep px-4 py-10 text-center text-sm text-gray-500">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

function StatPill({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 ${
        highlight
          ? "border-accent-red/30 bg-accent-red/10 text-accent-red/90"
          : "border-zen-border bg-zen-card"
      }`}
    >
      {label}{" "}
      <span className={`font-mono ${highlight ? "" : "text-gray-300"}`}>
        {value}
      </span>
    </span>
  );
}

function FunderAlertsPanel({
  alerts,
}: {
  alerts: NonNullable<ClusterGraph["meta"]["funderAlerts"]>;
}) {
  return (
    <div className="rounded-xl border border-accent-red/20 bg-accent-red/5 px-4 py-3">
      <p className="text-xs font-medium text-accent-red/90">
        Funder risk signals
      </p>
      <ul className="mt-2 space-y-2">
        {alerts.map((alert) => (
          <li key={alert.funder} className="text-xs text-gray-400">
            <span className="font-mono text-zen-mist">
              {truncateAddress(alert.funder, 6)}
            </span>
            <ul className="mt-1 space-y-0.5 pl-3 text-[11px] text-gray-500">
              {alert.signals.map((signal) => (
                <li key={signal}>· {signal}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}