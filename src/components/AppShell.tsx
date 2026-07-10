import Link from "next/link";
import type { ReactNode } from "react";
import { ZENERATING } from "@/lib/brand/zenerating";
import { AmbientBackground } from "./AmbientBackground";
import { UsageCounter } from "./UsageCounter";
import { WalletButton } from "./WalletButton";
import { ZenLogo } from "./ZenLogo";
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
    <div className="relative flex min-h-screen flex-col">
      <AmbientBackground />

      <header className="glass-header sticky top-0 z-40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="group flex shrink-0 items-center gap-3">
              <ZenLogo
                size="sm"
                showGlow
                className="transition-transform duration-300 group-hover:scale-110"
              />
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-semibold tracking-tight text-white transition-colors group-hover:text-zen-cyan/90">
                  {ZENERATING.name}
                </span>
                <span className="hidden text-[10px] text-gray-600 sm:inline">
                  {ZENERATING.tagline}
                </span>
              </span>
            </Link>
            {addressBar && (
              <>
                <span className="hidden text-zen-border sm:inline">/</span>
                <div className="min-w-0 flex-1 sm:flex-initial">{addressBar}</div>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {usage?.tier === "admin" && (
              <Link
                href="/admin"
                className="rounded-lg border border-zen-cyan/25 bg-zen-cyan/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-zen-cyan transition-colors hover:border-zen-cyan/40 hover:bg-zen-cyan/15"
              >
                Admin
              </Link>
            )}
            <WalletButton />
            <UsageCounter usage={usage} onUpgradeClick={onUpgradeClick} />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}