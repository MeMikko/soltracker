"use client";

import Link from "next/link";
import { useState } from "react";
import { AllSearchedTokensModal } from "@/components/AllSearchedTokensModal";
import { TokenSearchAvatar } from "@/components/TokenSearchAvatar";
import { useTokenSearches } from "@/hooks/useRecentTokens";
import { truncateAddress } from "@/lib/format";

const PREVIEW_LIMIT = 3;

const CARD_CLASS =
  "flex h-full flex-col items-center gap-2 rounded-xl border border-zen-border/70 bg-zen-card/60 px-3 py-4 text-center transition-all hover:border-zen-cyan/30 hover:bg-zen-card hover:shadow-[0_4px_20px_rgba(34,211,238,0.08)]";

function TokenSearchSkeleton() {
  return (
    <li>
      <div className={`${CARD_CLASS} animate-pulse pointer-events-none`}>
        <div className="h-12 w-12 rounded-xl bg-zen-border/40" />
        <div className="w-full space-y-2">
          <div className="mx-auto h-3.5 w-3/4 rounded bg-zen-border/40" />
          <div className="mx-auto h-2.5 w-1/2 rounded bg-zen-border/30" />
          <div className="mx-auto h-2.5 w-2/5 rounded bg-zen-border/30" />
        </div>
      </div>
    </li>
  );
}

interface RecentTokensListProps {
  className?: string;
}

export function RecentTokensList({ className }: RecentTokensListProps = {}) {
  const { tokens, total, loading } = useTokenSearches(PREVIEW_LIMIT, "popular");
  const [allOpen, setAllOpen] = useState(false);
  const showSkeletons = loading && tokens.length === 0;

  if (!showSkeletons && tokens.length === 0) {
    return (
      <section className={`mt-8 w-full max-w-6xl ${className ?? ""}`}>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zen-sage">
          Most searched
        </h2>
        <p className="rounded-xl border border-zen-border/50 bg-zen-card/30 px-4 py-3 text-center text-sm text-gray-500">
          No community searches yet. Search a token to populate this list.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className={`mt-8 w-full max-w-6xl ${className ?? ""}`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zen-sage">
            Most searched
          </h2>
          {!showSkeletons && total > PREVIEW_LIMIT && (
            <button
              type="button"
              onClick={() => setAllOpen(true)}
              className="text-[10px] font-medium text-zen-cyan transition-colors hover:text-zen-cyan/80"
            >
              View all {total} tokens
            </button>
          )}
        </div>

        <ul className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3">
          {showSkeletons
            ? Array.from({ length: PREVIEW_LIMIT }, (_, i) => (
                <TokenSearchSkeleton key={i} />
              ))
            : tokens.map((token) => {
                const label =
                  token.name ?? token.symbol ?? truncateAddress(token.mint, 4);
                const href = `/results/${encodeURIComponent(token.mint)}?type=token`;

                return (
                  <li key={token.mint}>
                    <Link href={href} className={`group ${CARD_CLASS}`}>
                      <TokenSearchAvatar
                        symbol={token.symbol}
                        mint={token.mint}
                        imageUrl={token.imageUrl}
                        name={token.name}
                      />
                      <div className="min-w-0 w-full">
                        <p className="truncate text-sm font-medium text-white group-hover:text-zen-cyan/90">
                          {label}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-gray-600">
                          {token.symbol
                            ? `$${token.symbol}`
                            : truncateAddress(token.mint, 4)}
                        </p>
                        <p className="mt-1 text-[10px] font-medium text-zen-sage">
                          {token.searchCount}{" "}
                          {token.searchCount === 1 ? "search" : "searches"}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
        </ul>

        {!showSkeletons && total > 0 && total <= PREVIEW_LIMIT && (
          <button
            type="button"
            onClick={() => setAllOpen(true)}
            className="mt-3 w-full text-center text-[10px] font-medium text-gray-500 transition-colors hover:text-zen-cyan"
          >
            View all searched tokens
          </button>
        )}
      </section>

      <AllSearchedTokensModal open={allOpen} onClose={() => setAllOpen(false)} />
    </>
  );
}