"use client";

import Link from "next/link";
import { useState } from "react";
import { useRecentTokens } from "@/hooks/useRecentTokens";
import { truncateAddress } from "@/lib/format";

function TokenAvatar({
  symbol,
  mint,
  imageUrl,
  name,
}: {
  symbol: string | null;
  mint: string;
  imageUrl: string | null;
  name: string | null;
}) {
  const [imgError, setImgError] = useState(false);
  const showImage = imageUrl && !imgError;
  const fallback = (symbol ?? name ?? mint).slice(0, 2).toUpperCase();

  return (
    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-zen-border/80 bg-zen-deep">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name ?? symbol ?? mint}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-zen-sage/15 text-xs font-bold text-zen-sage">
          {fallback}
        </div>
      )}
    </div>
  );
}

export function RecentTokensList() {
  const { tokens, loading } = useRecentTokens();

  if (loading) {
    return null;
  }

  if (tokens.length === 0) {
    return (
      <section className="mt-8 w-full max-w-2xl">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-zen-sage">
          Recently searched
        </h2>
        <p className="rounded-xl border border-zen-border/50 bg-zen-card/30 px-4 py-3 text-center text-sm text-gray-500">
          No community searches yet. Search a token to populate this list.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 w-full max-w-2xl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zen-sage">
          Recently searched
        </h2>
        <span className="text-[10px] text-gray-600">Community</span>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {tokens.map((token) => {
          const label = token.name ?? token.symbol ?? truncateAddress(token.mint, 4);
          const href = `/results/${encodeURIComponent(token.mint)}?type=token`;

          return (
            <li key={token.mint}>
              <Link
                href={href}
                className="group flex items-center gap-3 rounded-xl border border-zen-border/70 bg-zen-card/60 px-3 py-2.5 transition-all hover:border-zen-cyan/30 hover:bg-zen-card hover:shadow-[0_4px_20px_rgba(34,211,238,0.08)]"
              >
                <TokenAvatar
                  symbol={token.symbol}
                  mint={token.mint}
                  imageUrl={token.imageUrl}
                  name={token.name}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white group-hover:text-zen-cyan/90">
                    {label}
                  </p>
                  <p className="truncate font-mono text-[10px] text-gray-600">
                    {token.symbol ? `$${token.symbol} · ` : ""}
                    {truncateAddress(token.mint, 4)}
                    {token.searchCount > 1 ? ` · ${token.searchCount} searches` : ""}
                  </p>
                </div>
                <svg
                  className="h-4 w-4 shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zen-cyan"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}