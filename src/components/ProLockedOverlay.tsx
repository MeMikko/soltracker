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
    <div className="relative overflow-hidden rounded-xl border border-zen-border bg-zen-deep">
      <div className="pointer-events-none select-none blur-[5px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zen-deep/75 px-6 text-center backdrop-blur-[2px]">
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