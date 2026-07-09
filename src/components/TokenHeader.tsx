"use client";

import { useState } from "react";
import { TokenMarketStrip } from "@/components/TokenMarketStrip";
import { getGmgnTradeUrl } from "@/lib/gmgn";
import { truncateAddress } from "@/lib/format";
import type { TokenDetails } from "@/lib/types";

interface TokenHeaderProps {
  data: TokenDetails;
}

export function TokenHeader({ data }: TokenHeaderProps) {
  const [imgError, setImgError] = useState(false);

  const displayName = data.name ?? truncateAddress(data.mint, 6);
  const tradeUrl = getGmgnTradeUrl(data.mint);
  const showImage = data.imageUrl && !imgError;

  return (
    <div className="crypto-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-surface-border bg-surface-raised sm:h-16 sm:w-16">
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.imageUrl!}
              alt={displayName}
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zen-sage/15 text-lg font-bold text-zen-sage">
              {(data.symbol ?? data.mint).slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-white sm:text-xl">
            {displayName}
          </h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {data.symbol && (
              <span className="rounded-md bg-zen-sage/15 px-2 py-0.5 text-xs font-semibold text-zen-sage">
                ${data.symbol}
              </span>
            )}
            <span className="font-mono text-xs text-gray-500">
              {truncateAddress(data.mint, 8)}
            </span>
          </div>
          <TokenMarketStrip lp={data.lp} />
        </div>
      </div>

      <a
        href={tradeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 self-start px-5 py-2.5 text-sm sm:self-center"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
        Trade on GMGN
      </a>
    </div>
  );
}