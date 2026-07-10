"use client";

import { useState } from "react";
import { fetchCoinFlip } from "@/lib/api-client";

interface CoinFlipButtonProps {
  disabled?: boolean;
  onPick: (mint: string) => void | Promise<void>;
  onError?: (message: string | null) => void;
}

const FLIP_MS = 900;

export function CoinFlipButton({
  disabled = false,
  onPick,
  onError,
}: CoinFlipButtonProps) {
  const [flipping, setFlipping] = useState(false);

  async function handleFlip() {
    if (disabled || flipping) return;

    setFlipping(true);
    onError?.(null);

    const flipPromise = new Promise((resolve) => setTimeout(resolve, FLIP_MS));
    const result = await fetchCoinFlip();

    await flipPromise;

    if (!result.ok) {
      onError?.(result.error.error ?? "Could not pick a token. Try again.");
      setFlipping(false);
      return;
    }

    setFlipping(false);
    await onPick(result.data.mint);
  }

  return (
    <button
      type="button"
      onClick={() => void handleFlip()}
      disabled={disabled || flipping}
      className="btn-ghost shrink-0 px-4 py-3 text-sm font-medium sm:py-2.5 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="inline-flex items-center gap-1.5">
        <span
          className={`text-base leading-none ${flipping ? "animate-coin-flip" : ""}`}
          aria-hidden
        >
          🎲
        </span>
        <span>{flipping ? "Rolling…" : "Try your luck"}</span>
      </span>
    </button>
  );
}