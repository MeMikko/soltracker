import Link from "next/link";
import type { ReactNode } from "react";
import { ZENERATING } from "@/lib/brand/zenerating";
import { UsageCounter } from "./UsageCounter";
import { WalletButton } from "./WalletButton";
import type { UsageResponse } from "@/lib/types";

interface AppShellProps {
  children: ReactNode;
  usage: UsageResponse | null;
  onUpgradeClick?: () => void;
  addressBar?: ReactNode;
}

export function AppShell({
  children,
  usage,
  onUpgradeClick,
  addressBar,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-surface-border/80 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="group flex shrink-0 items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zen-sage/30 bg-zen-card text-xs font-bold text-zen-sage shadow-zen">
                Z
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight text-white group-hover:text-gray-200">
                  {ZENERATING.name}
                </span>
                <span className="hidden text-[10px] text-gray-600 xs:inline">
                  {ZENERATING.tagline}
                </span>
              </span>
            </Link>
            {addressBar && (
              <>
                <span className="hidden text-surface-border sm:inline">/</span>
                <div className="min-w-0 flex-1 sm:flex-initial">{addressBar}</div>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <WalletButton />
            <UsageCounter usage={usage} onUpgradeClick={onUpgradeClick} />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}