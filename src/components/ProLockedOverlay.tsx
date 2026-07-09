"use client";

import type { ReactNode } from "react";
import { TOKEN_UNLOCK_PRICE_SOL } from "@/lib/payments/config";

interface ProLockedOverlayProps {
  children: ReactNode;
  onUpgrade: () => void;
  onUnlockToken?: () => void;
  title?: string;
  description?: string;
}

export function ProLockedOverlay({
  children,
  onUpgrade,
  onUnlockToken,
  title = "Pro feature",
  description = "Upgrade to unlock wallet and token clustering.",
}: ProLockedOverlayProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zen-border/80 bg-zen-deep/80">
      <div className="pointer-events-none select-none blur-[6px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-zen-deep/60 via-zen-deep/80 to-zen-deep/90 px-6 text-center backdrop-blur-sm">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="max-w-xs text-xs leading-relaxed text-gray-500">
          {description}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {onUnlockToken && (
            <button
              type="button"
              onClick={onUnlockToken}
              className="btn-primary px-4 py-2 text-xs"
            >
              Unlock token · {TOKEN_UNLOCK_PRICE_SOL} SOL
            </button>
          )}
          <button type="button" onClick={onUpgrade} className="btn-ghost px-4 py-2 text-xs">
            Get Pro
          </button>
        </div>
      </div>
    </div>
  );
}