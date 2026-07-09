"use client";

import { useEffect, useState } from "react";
import { TokenSearchAvatar } from "@/components/TokenSearchAvatar";
import { FEATURED_TOKEN } from "@/lib/featured-token";
import { truncateAddress } from "@/lib/format";

interface FeaturedTokenData {
  mint: string;
  name: string | null;
  symbol: string | null;
  imageUrl: string | null;
  href: string;
}

export function FeaturedToken() {
  const [token, setToken] = useState<FeaturedTokenData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/featured-token")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: FeaturedTokenData | null) => {
        if (cancelled) return;
        setToken(
          data ?? {
            mint: FEATURED_TOKEN.mint,
            name: null,
            symbol: null,
            imageUrl: null,
            href: FEATURED_TOKEN.href,
          }
        );
      })
      .catch(() => {
        if (cancelled) return;
        setToken({
          mint: FEATURED_TOKEN.mint,
          name: null,
          symbol: null,
          imageUrl: null,
          href: FEATURED_TOKEN.href,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const href = token?.href ?? FEATURED_TOKEN.href;
  const mint = token?.mint ?? FEATURED_TOKEN.mint;
  const label = token?.name ?? token?.symbol ?? truncateAddress(mint, 4);

  return (
    <section className="mt-8 w-full max-w-4xl">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-zen-sage">
        Featured token
      </h2>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex items-center gap-4 rounded-xl border border-zen-border/70 bg-zen-card/60 px-4 py-4 transition-all hover:border-zen-cyan/30 hover:bg-zen-card hover:shadow-[0_4px_20px_rgba(34,211,238,0.08)] ${
          loading ? "animate-pulse pointer-events-none" : ""
        }`}
      >
        {loading ? (
          <>
            <div className="h-12 w-12 shrink-0 rounded-xl bg-zen-border/40" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-zen-border/40" />
              <div className="h-3 w-48 rounded bg-zen-border/30" />
            </div>
          </>
        ) : (
          <>
            <TokenSearchAvatar
              symbol={token?.symbol ?? null}
              mint={mint}
              imageUrl={token?.imageUrl ?? null}
              name={token?.name ?? null}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white group-hover:text-zen-cyan/90">
                {label}
              </p>
              <p className="mt-0.5 truncate font-mono text-[10px] text-gray-600">
                {token?.symbol ? `$${token.symbol} · ` : ""}
                {truncateAddress(mint, 6)}
              </p>
              <p className="mt-1 text-[10px] text-zen-sage">View on GMGN →</p>
            </div>
            <svg
              className="h-4 w-4 shrink-0 text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zen-cyan"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </>
        )}
      </a>
    </section>
  );
}