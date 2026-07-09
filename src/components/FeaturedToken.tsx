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
    <section className="relative mt-8 w-full max-w-4xl">
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-zen-cyan/50 via-zen-purple/40 to-zen-cyan/50 opacity-60 blur-[1px]"
        aria-hidden
      />

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`group relative block overflow-hidden rounded-2xl border border-zen-cyan/35 bg-gradient-to-br from-zen-card via-zen-card/95 to-zen-purple/10 shadow-[0_8px_40px_rgba(34,211,238,0.12)] transition-all hover:border-zen-cyan/55 hover:shadow-[0_12px_48px_rgba(34,211,238,0.2)] ${
          loading ? "animate-pulse pointer-events-none" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-zen-cyan/15 bg-gradient-to-r from-zen-cyan/10 via-transparent to-zen-purple/10 px-4 py-2.5 sm:px-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zen-cyan/30 bg-zen-cyan/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-zen-cyan">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zen-cyan shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
            Sponsored
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
            Featured spotlight
          </span>
        </div>

        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-zen-cyan/10 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-zen-purple/10 blur-2xl"
            aria-hidden
          />

          {loading ? (
            <>
              <div className="h-20 w-20 shrink-0 rounded-2xl bg-zen-border/40" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-3 w-24 rounded bg-zen-border/40" />
                <div className="h-6 w-40 rounded bg-zen-border/40" />
                <div className="h-3 w-56 rounded bg-zen-border/30" />
              </div>
            </>
          ) : (
            <>
              <div className="relative shrink-0">
                <div
                  className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-zen-cyan/40 to-zen-purple/30 opacity-70 blur-sm transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
                <div className="relative rounded-2xl ring-2 ring-zen-cyan/25 ring-offset-2 ring-offset-zen-card">
                  <TokenSearchAvatar
                    symbol={token?.symbol ?? null}
                    mint={mint}
                    imageUrl={token?.imageUrl ?? null}
                    name={token?.name ?? null}
                    size="lg"
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zen-cyan">
                  Featured token
                </p>
                <h3 className="mt-1 truncate text-xl font-bold tracking-tight text-white group-hover:text-zen-cyan/95 sm:text-2xl">
                  {label}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {token?.symbol && (
                    <span className="rounded-md bg-zen-sage/15 px-2 py-0.5 text-xs font-semibold text-zen-sage">
                      ${token.symbol}
                    </span>
                  )}
                  <span className="font-mono text-xs text-gray-500">
                    {truncateAddress(mint, 8)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  Community spotlight — trade and chart on GMGN in one click.
                </p>
              </div>

              <div className="shrink-0 sm:self-center">
                <span className="btn-primary inline-flex w-full items-center justify-center gap-2 px-6 py-3 text-sm sm:w-auto">
                  Trade on GMGN
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </div>
            </>
          )}
        </div>
      </a>

      <p className="mt-2.5 text-center text-[10px] text-gray-600">
        Promote your token here —{" "}
        <span className="text-zen-sage">featured placements available</span>
      </p>
    </section>
  );
}