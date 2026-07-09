"use client";

import { truncateAddress } from "@/lib/format";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { WalletPickerModal } from "./WalletPickerModal";

export function WalletButton() {
  const {
    session,
    connecting,
    pickerOpen,
    wallets,
    error,
    beginConnect,
    connectWith,
    closePicker,
    disconnect,
  } = useWalletAuth();

  if (session?.disabled) {
    return null;
  }

  if (session?.authenticated && session.wallet) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden rounded-full border border-zen-cyan/25 bg-zen-cyan/10 px-2.5 py-1 font-mono text-xs text-zen-cyan sm:inline">
          {truncateAddress(session.wallet, 4)}
        </span>
        <button
          type="button"
          onClick={disconnect}
          className="btn-ghost px-3 py-1.5 text-xs"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={beginConnect}
          disabled={connecting}
          className="btn-primary px-4 py-1.5 text-xs sm:text-sm"
        >
          {connecting ? "Signing…" : "Connect Wallet"}
        </button>
        {error && (
          <p className="max-w-[200px] text-right text-[10px] leading-snug text-accent-red sm:max-w-[240px] sm:text-xs">
            {error}
          </p>
        )}
      </div>

      <WalletPickerModal
        open={pickerOpen}
        wallets={wallets}
        onSelect={connectWith}
        onClose={closePicker}
      />
    </>
  );
}