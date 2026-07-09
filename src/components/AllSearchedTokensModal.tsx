"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchTokenSearches } from "@/lib/api-client";
import { truncateAddress } from "@/lib/format";
import type { RecentToken } from "@/lib/types";
import { TokenSearchAvatar } from "./TokenSearchAvatar";

interface AllSearchedTokensModalProps {
  open: boolean;
  onClose: () => void;
}

export function AllSearchedTokensModal({
  open,
  onClose,
}: AllSearchedTokensModalProps) {
  const [tokens, setTokens] = useState<RecentToken[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);

    void fetchTokenSearches(500, "popular").then((result) => {
      if (cancelled) return;
      setTokens(result.tokens);
      setTotal(result.total);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="crypto-card flex max-h-[85vh] w-full max-w-2xl flex-col border-zen-border/80 p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">All searched tokens</h3>
            <p className="mt-1 text-xs text-gray-500">
              {loading
                ? "Loading community searches…"
                : `${total} unique token${total === 1 ? "" : "s"} · sorted by search count`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-zen-border/70 px-2.5 py-1 text-xs text-gray-400 transition-colors hover:border-zen-cyan/30 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
          ) : tokens.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No community searches yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {tokens.map((token, index) => {
                const label =
                  token.name ?? token.symbol ?? truncateAddress(token.mint, 4);
                const href = `/results/${encodeURIComponent(token.mint)}?type=token`;

                return (
                  <li key={token.mint}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className="group flex items-center gap-3 rounded-xl border border-zen-border/60 bg-zen-card/40 px-3 py-2.5 transition-all hover:border-zen-cyan/30 hover:bg-zen-card"
                    >
                      <span className="w-5 shrink-0 text-center text-[10px] font-semibold text-gray-600">
                        {index + 1}
                      </span>
                      <TokenSearchAvatar
                        symbol={token.symbol}
                        mint={token.mint}
                        imageUrl={token.imageUrl}
                        name={token.name}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white group-hover:text-zen-cyan/90">
                          {label}
                        </p>
                        <p className="truncate font-mono text-[10px] text-gray-600">
                          {token.symbol ? `$${token.symbol} · ` : ""}
                          {truncateAddress(token.mint, 4)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-zen-sage/10 px-2 py-0.5 text-[10px] font-medium text-zen-sage">
                        {token.searchCount}{" "}
                        {token.searchCount === 1 ? "search" : "searches"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}