"use client";

interface WalletGateProps {
  authenticated: boolean;
  disabled?: boolean;
}

export function WalletGate({ authenticated, disabled }: WalletGateProps) {
  if (disabled || authenticated) {
    return null;
  }

  return (
    <div className="rounded-xl border border-zen-cyan/15 bg-zen-deep/50 px-4 py-3 text-center">
      <p className="text-xs font-medium text-gray-300">
        Connect wallet to start searching
      </p>
      <p className="mt-1 text-[11px] text-gray-600">
        5 free searches per day · sign in with header button
      </p>
    </div>
  );
}