"use client";

import Link from "next/link";
import { ZENERATING } from "@/lib/brand/zenerating";
import { truncateAddress } from "@/lib/format";
import type { ApiError, RiskLevel } from "@/lib/types";
import type { DeployerReputation } from "@/lib/token/deployer-reputation";

interface DeployerReputationSectionProps {
  data: DeployerReputation | null;
  loading: boolean;
  error: ApiError | null;
}

const LEVEL_STYLES: Record<RiskLevel, string> = {
  low: "text-accent-green border-accent-green/30 bg-accent-green/10",
  medium: "text-accent-yellow border-accent-yellow/30 bg-accent-yellow/10",
  high: "text-accent-red border-accent-red/30 bg-accent-red/10",
};

const LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Trusted pattern",
  medium: "Mixed history",
  high: "High risk",
};

export function DeployerReputationSection({
  data,
  loading,
  error,
}: DeployerReputationSectionProps) {
  const missing = !loading && !error && !data;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zen-sage">
          {ZENERATING.name} · Phase 6
        </p>
        <h3 className="mt-1 text-base font-semibold text-white">
          Deployer Reputation
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Cross-token deploy history and rug-risk signals for this creator.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-zen-border bg-zen-deep px-4 py-10 text-center text-sm text-zen-mist">
          Tracing deployer history…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-accent-red/20 bg-accent-red/5 px-4 py-6 text-center text-sm text-accent-red">
          {error.error}
        </div>
      ) : missing ? (
        <div className="rounded-xl border border-zen-border bg-zen-deep px-4 py-8 text-center text-sm text-gray-500">
          Creator wallet not identified — deployer reputation unavailable.
        </div>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-[minmax(140px,180px)_1fr]">
            <div className="crypto-card flex flex-col items-center justify-center p-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-gray-500">
                Reputation
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                {data.score}
              </p>
              <span
                className={`mt-2 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${LEVEL_STYLES[data.level]}`}
              >
                {LEVEL_LABELS[data.level]}
              </span>
            </div>

            <div className="crypto-card space-y-3 p-4">
              <p className="font-mono text-xs text-zen-mist">
                {truncateAddress(data.wallet, 6)}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-lg border border-zen-border/70 bg-zen-deep/50 px-2 py-2">
                  <p className="text-lg font-semibold text-white">
                    {data.totalPriorDeploys}
                  </p>
                  <p className="text-gray-600">Prior tokens</p>
                </div>
                <div className="rounded-lg border border-accent-red/20 bg-accent-red/5 px-2 py-2">
                  <p className="text-lg font-semibold text-accent-red">
                    {data.activeMintAuthorityCount}
                  </p>
                  <p className="text-gray-600">Live mint auth</p>
                </div>
                <div className="rounded-lg border border-accent-green/20 bg-accent-green/5 px-2 py-2">
                  <p className="text-lg font-semibold text-accent-green">
                    {data.revokedMintAuthorityCount}
                  </p>
                  <p className="text-gray-600">Revoked mints</p>
                </div>
              </div>
            </div>
          </div>

          {data.signals.length > 0 && (
            <ul className="space-y-2 rounded-xl border border-zen-border/80 bg-zen-deep/50 px-4 py-3">
              {data.signals.map((signal) => (
                <li key={signal} className="flex gap-2 text-xs text-gray-400">
                  <span className="text-zen-cyan">·</span>
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          )}

          {data.priorDeploys.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-zen-border/80">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zen-border/70 bg-zen-card/80 text-[10px] uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">Token</th>
                    <th className="px-3 py-2.5 font-medium">Mint</th>
                    <th className="px-3 py-2.5 font-medium">Mint authority</th>
                  </tr>
                </thead>
                <tbody>
                  {data.priorDeploys.map((deploy) => (
                    <tr
                      key={deploy.mint}
                      className="border-b border-zen-border/40 last:border-0"
                    >
                      <td className="px-3 py-2.5 text-gray-300">
                        {deploy.symbol ?? deploy.name ?? "Unknown"}
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/results/${deploy.mint}?type=token`}
                          className="font-mono text-zen-cyan hover:underline"
                        >
                          {truncateAddress(deploy.mint, 6)}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={
                            deploy.mintAuthorityActive
                              ? "text-accent-red"
                              : "text-accent-green"
                          }
                        >
                          {deploy.mintAuthorityActive ? "Active" : "Revoked"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              No prior deploys indexed for this creator yet.
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}