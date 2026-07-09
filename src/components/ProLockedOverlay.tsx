"use client";

import type { ReactNode } from "react";

interface ProLockedOverlayProps {
  children: ReactNode;
  onUpgrade: () => void;
  title?: string;
  description?: string;
}

export function ProLockedOverlay({
  children,
  onUpgrade,
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
        <button type="button" onClick={onUpgrade} className="btn-primary px-4 py-2 text-xs">
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}