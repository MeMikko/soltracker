"use client";

import type { WalletAdapter } from "@/lib/wallet/types";

interface WalletPickerModalProps {
  open: boolean;
  wallets: WalletAdapter[];
  onSelect: (wallet: WalletAdapter) => void;
  onClose: () => void;
}

export function WalletPickerModal({
  open,
  wallets,
  onSelect,
  onClose,
}: WalletPickerModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="crypto-card w-full max-w-xs border-solana-purple/20 p-4 sm:max-w-sm sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-white">Choose wallet</h3>
        <p className="mt-1 text-xs text-gray-500">
          Phantom, Jupiter, Solflare and more
        </p>
        <ul className="mt-4 space-y-2">
          {wallets.map((wallet) => (
            <li key={wallet.id}>
              <button
                type="button"
                onClick={() => onSelect(wallet)}
                className="flex w-full items-center gap-3 rounded-lg border border-surface-border bg-surface-raised/80 px-3 py-2.5 text-left transition-colors hover:border-solana-purple/40 hover:bg-surface-hover"
              >
                {wallet.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={wallet.icon}
                    alt=""
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-border text-[10px] font-bold text-gray-400">
                    {wallet.name.slice(0, 1)}
                  </span>
                )}
                <span className="text-sm font-medium text-gray-200">
                  {wallet.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={onClose} className="btn-ghost mt-4 w-full">
          Cancel
        </button>
      </div>
    </div>
  );
}