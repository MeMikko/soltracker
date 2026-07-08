"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { RiskBreakdown } from "@/components/RiskBreakdown";
import { RiskScore } from "@/components/RiskScore";
import { SearchBar } from "@/components/SearchBar";
import { TokenDetails } from "@/components/TokenDetails";
import { TokenHeader } from "@/components/TokenHeader";
import { UpgradeModal } from "@/components/UpgradeModal";
import { WalletClusterSection } from "@/components/clustering/WalletClusterSection";
import { TokenComingSoonSections } from "@/components/teasers/ComingSoonTeaser";
import { WalletDetails } from "@/components/WalletDetails";
import { ZENERATING } from "@/lib/brand/zenerating";
import { WalletGate } from "@/components/WalletGate";
import { useUsage } from "@/hooks/useUsage";
import {
  fetchRisk,
  fetchToken,
  fetchWallet,
  searchAddress,
} from "@/lib/api-client";
import { truncateAddress } from "@/lib/format";
import type {
  ApiError,
  EntityType,
  RiskResponse,
  TokenDetails as TokenDetailsType,
  UsageResponse,
  WalletDetails as WalletDetailsType,
} from "@/lib/types";

function applyUsage(
  setUsage: (usage: UsageResponse) => void,
  usage: UsageResponse | null
) {
  if (usage) {
    setUsage(usage);
  }
}

export function ResultsContent() {
  const params = useParams<{ address: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const address = decodeURIComponent(params.address);
  const typeParam = searchParams.get("type") as EntityType | null;

  const { usage, setUsage, refresh } = useUsage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [entityType, setEntityType] = useState<EntityType | null>(typeParam);
  const [risk, setRisk] = useState<RiskResponse | null>(null);
  const [wallet, setWallet] = useState<WalletDetailsType | null>(null);
  const [token, setToken] = useState<TokenDetailsType | null>(null);
  const requestIdRef = useRef(0);

  const loadResults = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    let type = typeParam;

    if (!type) {
      const search = await searchAddress(address);
      if (requestId !== requestIdRef.current) return;

      if (!search.ok) {
        setError(search.error);
        setLoading(false);
        return;
      }
      type = search.data.type;
      setEntityType(type);
      applyUsage(setUsage, search.usage);
    }

    const riskResult = await fetchRisk(type, address);
    if (requestId !== requestIdRef.current) return;

    if (!riskResult.ok) {
      setError(riskResult.error);
      setLoading(false);
      return;
    }

    applyUsage(setUsage, riskResult.usage);
    setRisk(riskResult.data);
    setEntityType(type);

    const detailsResult =
      type === "wallet"
        ? await fetchWallet(address)
        : await fetchToken(address);

    if (requestId !== requestIdRef.current) return;

    if (!detailsResult.ok) {
      setError(detailsResult.error);
      setLoading(false);
      return;
    }

    applyUsage(setUsage, detailsResult.usage);

    if (type === "wallet") {
      setWallet(detailsResult.data as WalletDetailsType);
      setToken(null);
    } else {
      setToken(detailsResult.data as TokenDetailsType);
      setWallet(null);
    }

    setLoading(false);
    await refresh();
  }, [address, typeParam, refresh, setUsage]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const isAuthenticated = usage?.authenticated ?? false;

  async function handleSearch(newAddress: string) {
    if (!isAuthenticated) {
      return;
    }

    if (usage?.remaining === 0) {
      setUpgradeOpen(true);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await searchAddress(newAddress);
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      if (result.status === 429) await refresh();
      return;
    }

    applyUsage(setUsage, result.usage);
    router.push(`/results/${newAddress}?type=${result.data.type}`);
  }

  const addressBar = (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <span className="truncate font-mono text-xs text-gray-400 sm:text-sm">
        {truncateAddress(address, 6)}
      </span>
      {entityType && (
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider sm:text-xs ${
            entityType === "token"
              ? "bg-solana-purple/15 text-solana-purple"
              : "bg-solana-green/15 text-solana-green"
          }`}
        >
          {entityType}
        </span>
      )}
    </div>
  );

  return (
    <AppShell
      usage={usage}
      onUpgradeClick={() => setUpgradeOpen(true)}
      addressBar={addressBar}
    >
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="crypto-card mb-6 space-y-3 p-3 sm:p-4">
          <div className="flex justify-center">
            <WalletGate authenticated={isAuthenticated} />
          </div>
          <SearchBar
            onSearch={handleSearch}
            loading={loading}
            disabled={!isAuthenticated || usage?.remaining === 0}
            compact
          />
        </div>

        {loading ? (
          <LoadingState message="Fetching on-chain data…" />
        ) : error ? (
          <ErrorState
            error={error}
            onRetry={loadResults}
            onUpgrade={() => setUpgradeOpen(true)}
          />
        ) : risk ? (
          <div className="space-y-6 lg:space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zen-sage">
                  {ZENERATING.name}
                </p>
                <p className="mt-1 text-xs text-gray-500">{ZENERATING.tagline}</p>
              </div>
              <p className="text-[10px] text-gray-600">
                {entityType === "token" ? "Token intelligence" : "Wallet intelligence"}
              </p>
            </div>

            {token && <TokenHeader data={token} />}

            <div className="grid gap-6 lg:grid-cols-[minmax(240px,280px)_1fr] lg:gap-8">
              <div className="lg:sticky lg:top-24 lg:self-start">
                <RiskScore score={risk.score} level={risk.level} />
              </div>
              <RiskBreakdown factors={risk.breakdown} />
            </div>

            {(wallet || token) && (
              <div className="crypto-card p-4 sm:p-6">
                {wallet && <WalletDetails data={wallet} />}
                {token && <TokenDetails data={token} />}
              </div>
            )}

            {wallet && (
              <div className="crypto-card p-4 sm:p-6">
                <WalletClusterSection address={address} context="wallet" />
              </div>
            )}

            {token && (
              <>
                <div className="crypto-card p-4 sm:p-6">
                  <WalletClusterSection
                    address={address}
                    context="token_creator"
                    creatorAddress={token.creator}
                    tokenSymbol={token.symbol}
                  />
                </div>

                <div className="crypto-card p-4 sm:p-6">
                  <TokenComingSoonSections />
                </div>
              </>
            )}
          </div>
        ) : null}
      </main>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </AppShell>
  );
}