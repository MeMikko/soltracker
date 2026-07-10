"use client";

import { useState } from "react";
import { fetchCoinFlip } from "@/lib/api-client";
import type { TrendingToken } from "@/lib/trending-tokens";

interface CoinFlipButtonProps {
  disabled?: boolean;
  onPick: (mint: string) => void | Promise<void>;
}

const FLIP_MS = 900;

export function CoinFlipButton({ disabled = false, onPick }: CoinFlipButtonProps) {
  const [flipping, setFlipping] = useState(false);
  const [preview, setPreview] = useState<TrendingToken | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFlip() {
    if (disabled || flipping) return;

    setFlipping(true);
    setError(null);
    setPreview(null);

    const flipPromise = new Promise((resolve) => setTimeout(resolve, FLIP_MS));
    const result = await fetchCoinFlip();

    await flipPromise;

    if (!result.ok) {
      setError(result.error.error ?? "Could not flip. Try again.");
      setFlipping(false);
      return;
    }

    setPreview(result.data);
    setFlipping(false);
    await onPick(result.data.mint);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => void handleFlip()}
        disabled={disabled || flipping}
        className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-zen-border/70 bg-gradient-to-r from-zen-card/80 via-zen-deep/60 to-zen-card/80 px-4 py-3 text-left transition-all hover:border-zen-cyan/40 hover:shadow-[0_4px_24px_rgba(34,211,238,0.1)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-zen-cyan/30 bg-gradient-to-br from-zen-cyan/20 to-zen-purple/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${
            flipping ? "animate-coin-flip" : "group-hover:scale-105"
          } transition-transform`}
          aria-hidden
        >
          <span className="text-lg font-bold text-zen-cyan">Z</span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-white">
            {flipping ? "Flipping…" : "Coin flip"}
          </span>
          <span className="mt-0.5 block text-[11px] text-gray-500">
            Random token from DexScreener trending
          </span>
        </span>

        <span className="shrink-0 rounded-lg border border-zen-border/60 bg-zen-deep/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zen-sage">
          Ape
        </span>
      </button>

      {error && (
        <p className="text-center text-xs text-accent-red">{error}</p>
      )}

      {preview && !flipping && (
        <p className="text-center text-[11px] text-gray-500">
          Landed on{" "}
          <span className="font-medium text-zen-cyan">
            {preview.symbol ?? preview.name ?? "a trending token"}
          </span>
        </p>
      )}
    </div>
  );
}