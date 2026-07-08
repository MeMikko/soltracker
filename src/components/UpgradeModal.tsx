"use client";

import { useEffect, useState } from "react";
import { activateProPayment } from "@/lib/api-client";
import { useUsage } from "@/hooks/useUsage";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { truncateAddress } from "@/lib/format";
import {
  PRO_PERIOD_DAYS,
  PRO_PRICE_SOL,
  PRO_TREASURY_WALLET,
} from "@/lib/pro/config";
import { getStoredWalletName } from "@/lib/wallet/payment-provider";
import {
  getPaymentEnvironmentError,
  sendProSubscriptionPayment,
} from "@/lib/wallet/pro-payment";
import { WalletPickerModal } from "./WalletPickerModal";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const FEATURES = [
  "Unlimited daily searches",
  "Full wallet & token clustering",
  "Priority indexing as features ship",
  "Renew monthly — cancel anytime",
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const { usage, refresh } = useUsage();
  const {
    session,
    beginConnect,
    connecting,
    pickerOpen,
    wallets,
    connectWith,
    closePicker,
  } = useWalletAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const wallet = session?.wallet ?? usage?.wallet ?? null;
  const isSignedIn = Boolean(wallet);
  const isPro = usage?.tier === "pro" || usage?.tier === "admin";
  const isFreeAtLimit =
    usage?.tier === "free" && isSignedIn && usage.remaining === 0;
  const signedInWalletName = getStoredWalletName();
  const mobileHint = getPaymentEnvironmentError();

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(null);
    void refresh();
  }, [open, refresh]);

  if (!open) return null;

  async function handlePay() {
    if (!wallet) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const signature = await sendProSubscriptionPayment(wallet);

      let lastError = "Payment verification failed";
      for (let attempt = 0; attempt < 6; attempt += 1) {
        if (attempt > 0) await sleep(2000);

        const result = await activateProPayment(signature);
        if (result.ok) {
          setSuccess(
            `Pro active until ${new Date(result.data.pro.expiresAt!).toLocaleDateString()}`
          );
          window.dispatchEvent(new CustomEvent("usage-changed"));
          await refresh();
          return;
        }

        lastError = result.error.error;
        if (result.error.code !== "PAYMENT_INVALID") break;
      }

      setError(lastError);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-title"
        onClick={onClose}
      >
        <div
          className="crypto-card w-full max-w-md border-zen-sage/20 p-6 shadow-zen-lg sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl border border-zen-sage/30 bg-zen-sage/15 text-sm font-bold text-zen-sage">
            Pro
          </div>
          <h2 id="upgrade-title" className="mt-4 text-xl font-bold text-white">
            {isPro ? "Pro active" : "Upgrade to Pro"}
          </h2>

          {isPro ? (
            <p className="mt-2 text-sm leading-relaxed text-zen-sage">
              {usage?.tier === "admin"
                ? "Admin access — unlimited searches."
                : `Unlimited searches${
                    usage?.proExpiresAt
                      ? ` until ${new Date(usage.proExpiresAt).toLocaleDateString()}`
                      : ""
                  }.`}
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Pay{" "}
              <span className="font-semibold text-white">
                {PRO_PRICE_SOL} SOL
              </span>{" "}
              per {PRO_PERIOD_DAYS} days for unlimited searches. Free tier stays
              at 5 searches/day per wallet.
            </p>
          )}

          {isSignedIn && !isPro && (
            <div className="mt-4 rounded-lg border border-zen-border bg-zen-deep/80 px-3 py-2.5 text-xs text-gray-500">
              <p>
                Signed in as{" "}
                <span className="font-mono text-zen-mist">
                  {truncateAddress(wallet!, 6)}
                </span>
              </p>
              <p className="mt-1">
                Payment of {PRO_PRICE_SOL} SOL to{" "}
                <span className="font-mono text-zen-mist">
                  {truncateAddress(PRO_TREASURY_WALLET, 6)}
                </span>
              </p>
              {signedInWalletName && (
                <p className="mt-1 text-zen-mist">
                  Pay with <span className="text-white">{signedInWalletName}</span>{" "}
                  — the same wallet you signed in with.
                </p>
              )}
              {mobileHint ? (
                <p className="mt-1 text-accent-red/90">{mobileHint}</p>
              ) : (
                <p className="mt-1 text-zen-mist">
                  Press Pay — {signedInWalletName ?? "your wallet"} will ask to
                  approve the 0.1 SOL transfer.
                </p>
              )}
              {isFreeAtLimit && (
                <p className="mt-1 text-accent-red/90">
                  Daily free searches used — Pro unlocks unlimited access.
                </p>
              )}
            </div>
          )}

          {!isSignedIn && (
            <div className="mt-4 rounded-lg border border-accent-red/20 bg-accent-red/5 px-3 py-2.5 text-xs text-accent-red/90">
              Connect and sign in with your Solana wallet before paying for Pro.
            </div>
          )}

          {!isPro && (
            <ul className="mt-5 space-y-2.5">
              {FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2.5 text-sm text-gray-300"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zen-sage/15 text-zen-sage">
                    <svg
                      className="h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p className="mt-4 rounded-lg border border-accent-red/25 bg-accent-red/10 px-3 py-2 text-xs text-accent-red">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-4 rounded-lg border border-zen-sage/25 bg-zen-sage/10 px-3 py-2 text-xs text-zen-sage">
              {success}
            </p>
          )}

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:gap-3">
            {!isSignedIn ? (
              <button
                type="button"
                onClick={beginConnect}
                disabled={connecting}
                className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {connecting ? "Signing…" : "Connect Wallet"}
              </button>
            ) : isPro ? (
              <button type="button" onClick={onClose} className="btn-primary flex-1">
                Done
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void handlePay()}
                  disabled={loading || Boolean(success)}
                  className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Approve in wallet…"
                    : `Pay ${PRO_PRICE_SOL} SOL / month`}
                </button>
              </>
            )}
            <button type="button" onClick={onClose} className="btn-ghost sm:px-6">
              Close
            </button>
          </div>
        </div>
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