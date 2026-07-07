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
    <div className="mx-auto w-full max-w-sm rounded-lg border border-solana-purple/15 bg-surface-raised/40 px-3.5 py-2.5 text-center">
      <p className="text-xs font-medium text-gray-300">Connect wallet to search</p>
      <p className="mt-1 text-[11px] leading-snug text-gray-600">
        5 free searches/day per wallet · sign to verify · max 2 wallets/network/day
      </p>
      <p className="mt-1.5 text-[10px] text-solana-purple/70">
        Use Connect Wallet in the header
      </p>
    </div>
  );
}