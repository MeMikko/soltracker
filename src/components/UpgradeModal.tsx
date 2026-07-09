"use client";

import { useEffect, useState } from "react";
import {
  activateProPayment,
  activateSearchPackPayment,
  activateTokenUnlockPayment,
} from "@/lib/api-client";
import { useUsage } from "@/hooks/useUsage";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { truncateAddress } from "@/lib/format";
import {
  EXTRA_SEARCH_PACK_COUNT,
  EXTRA_SEARCH_PACK_PRICE_LAMPORTS,
  EXTRA_SEARCH_PACK_PRICE_SOL,
  TOKEN_UNLOCK_DAYS,
  TOKEN_UNLOCK_PRICE_LAMPORTS,
  TOKEN_UNLOCK_PRICE_SOL,
} from "@/lib/payments/config";
import {
  PRO_PERIOD_DAYS,
  PRO_PRICE_SOL,
} from "@/lib/pro/config";
import {
  sendProSubscriptionPayment,
  sendTreasuryPayment,
} from "@/lib/wallet/pro-payment";
import { WalletPickerModal } from "./WalletPickerModal";
import { ZenLogo } from "./ZenLogo";

export type PurchaseFocus = "pro" | "search_pack" | "token_unlock";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  focus?: PurchaseFocus;
  unlockMint?: string | null;
  onPurchaseComplete?: () => void;
}

const PRO_FEATURES = [
  "Unlimited daily searches",
  "Wallet & token clustering (Phase 4)",
  "Holder analytics & deployer reputation",
  "All future phases as they ship",
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyWithRetries<T>(
  attempt: () => Promise<
    { ok: true; data: T } | { ok: false; error: { error: string; code: string } }
  >
): Promise<{ data: T | null; error: string | null }> {
  let lastError = "Payment verification failed";

  for (let i = 0; i < 6; i += 1) {
    if (i > 0) await sleep(2000);

    const result = await attempt();
    if (result.ok) {
      return { data: result.data, error: null };
    }

    lastError = result.error.error;
    if (result.error.code !== "PAYMENT_INVALID") break;
  }

  return { data: null, error: lastError };
}

function focusRing(focus: PurchaseFocus, current: PurchaseFocus) {
  return focus === current
    ? "border-zen-cyan/45 ring-1 ring-zen-cyan/25"
    : "border-zen-border/70";
}

export function UpgradeModal({
  open,
  onClose,
  focus = "pro",
  unlockMint = null,
  onPurchaseComplete,
}: UpgradeModalProps) {
  const { usage, setUsage, refresh } = useUsage();
  const {
    session,
    beginConnect,
    connecting,
    pickerOpen,
    wallets,
    connectWith,
    closePicker,
  } = useWalletAuth();

  const [loadingProduct, setLoadingProduct] = useState<PurchaseFocus | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const wallet = session?.wallet ?? usage?.wallet ?? null;
  const isSignedIn = Boolean(wallet);
  const isPro = usage?.tier === "pro" || usage?.tier === "admin";

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSuccess(null);
    void refresh();
  }, [open, refresh]);

  if (!open) return null;

  async function completePurchase(message: string, nextUsage?: typeof usage) {
    setSuccess(message);
    if (nextUsage) setUsage(nextUsage);
    window.dispatchEvent(new CustomEvent("usage-changed"));
    window.dispatchEvent(new CustomEvent("token-unlock-changed"));
    await refresh();
    onPurchaseComplete?.();
  }

  async function handleSearchPack() {
    if (!wallet) return;
    setLoadingProduct("search_pack");
    setError(null);
    setSuccess(null);

    try {
      const signature = await sendTreasuryPayment(
        wallet,
        EXTRA_SEARCH_PACK_PRICE_LAMPORTS,
        `${EXTRA_SEARCH_PACK_PRICE_SOL} SOL`
      );

      const { data, error: verifyError } = await verifyWithRetries(() =>
        activateSearchPackPayment(signature)
      );

      if (!data) {
        setError(verifyError);
        return;
      }

      await completePurchase(
        `${EXTRA_SEARCH_PACK_COUNT} bonus searches added. You now have ${data.purchase.bonusSearches} extra searches.`,
        data.usage
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoadingProduct(null);
    }
  }

  async function handleTokenUnlock() {
    if (!wallet || !unlockMint) return;
    setLoadingProduct("token_unlock");
    setError(null);
    setSuccess(null);

    try {
      const signature = await sendTreasuryPayment(
        wallet,
        TOKEN_UNLOCK_PRICE_LAMPORTS,
        `${TOKEN_UNLOCK_PRICE_SOL} SOL`
      );

      const { data, error: verifyError } = await verifyWithRetries(() =>
        activateTokenUnlockPayment(signature, unlockMint)
      );

      if (!data) {
        setError(verifyError);
        return;
      }

      const until = data.unlock.expiresAt
        ? new Date(data.unlock.expiresAt).toLocaleDateString()
        : "now";

      await completePurchase(
        `Token intelligence unlocked until ${until}.`,
        data.usage
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoadingProduct(null);
    }
  }

  async function handlePro() {
    if (!wallet) return;
    setLoadingProduct("pro");
    setError(null);
    setSuccess(null);

    try {
      const signature = await sendProSubscriptionPayment(wallet);

      const { data, error: verifyError } = await verifyWithRetries(() =>
        activateProPayment(signature)
      );

      if (!data) {
        setError(verifyError);
        return;
      }

      await completePurchase(
        `Pro active until ${new Date(data.pro.expiresAt!).toLocaleDateString()}.`,
        data.usage
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoadingProduct(null);
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
          className="crypto-card max-h-[90vh] w-full max-w-lg overflow-y-auto border-zen-sage/20 p-6 shadow-zen-lg sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <ZenLogo size="md" showGlow />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zen-cyan">
                Upgrade
              </p>
              <h2 id="upgrade-title" className="text-xl font-bold text-white">
                {isPro ? "Pro active" : "Choose your upgrade"}
              </h2>
            </div>
          </div>

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
              Pay once for extra searches or a single token unlock, or subscribe
              to Pro for unlimited access everywhere.
            </p>
          )}

          {isSignedIn && !isPro && (
            <p className="mt-4 text-xs text-gray-500">
              Signed in as{" "}
              <span className="font-mono text-zen-mist">
                {truncateAddress(wallet!, 6)}
              </span>
            </p>
          )}

          {!isSignedIn && !isPro && (
            <p className="mt-4 text-xs text-gray-500">
              Connect your Solana wallet to pay with SOL.
            </p>
          )}

          {!isPro && (
            <div className="mt-5 space-y-3">
              <div
                className={`rounded-xl border bg-zen-card/50 p-4 ${focusRing(focus, "search_pack")}`}
              >
                <p className="text-sm font-semibold text-white">
                  Extra search pack
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  {EXTRA_SEARCH_PACK_COUNT} additional searches after your daily
                  free quota. Does not expire until used.
                </p>
                <p className="mt-2 text-sm font-semibold text-zen-cyan">
                  {EXTRA_SEARCH_PACK_PRICE_SOL} SOL
                </p>
                <button
                  type="button"
                  onClick={() => void handleSearchPack()}
                  disabled={!isSignedIn || loadingProduct !== null || Boolean(success)}
                  className="btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingProduct === "search_pack"
                    ? "Approve in wallet…"
                    : `Buy ${EXTRA_SEARCH_PACK_COUNT} searches`}
                </button>
              </div>

              {unlockMint && (
                <div
                  className={`rounded-xl border bg-zen-card/50 p-4 ${focusRing(focus, "token_unlock")}`}
                >
                  <p className="text-sm font-semibold text-white">
                    Unlock this token
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">
                    Clustering, holder analytics, and deployer reputation for{" "}
                    <span className="font-mono text-zen-mist">
                      {truncateAddress(unlockMint, 4)}
                    </span>{" "}
                    for {TOKEN_UNLOCK_DAYS} days.
                  </p>
                  <p className="mt-2 text-sm font-semibold text-zen-cyan">
                    {TOKEN_UNLOCK_PRICE_SOL} SOL
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleTokenUnlock()}
                    disabled={!isSignedIn || loadingProduct !== null || Boolean(success)}
                    className="btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingProduct === "token_unlock"
                      ? "Approve in wallet…"
                      : "Unlock token intelligence"}
                  </button>
                </div>
              )}

              <div
                className={`rounded-xl border bg-zen-card/50 p-4 ${focusRing(focus, "pro")}`}
              >
                <p className="text-sm font-semibold text-white">Pro</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  Unlimited searches and all intelligence modules on every
                  token and wallet for {PRO_PERIOD_DAYS} days.
                </p>
                <ul className="mt-3 space-y-1.5">
                  {PRO_FEATURES.map((feature) => (
                    <li
                      key={feature}
                      className="text-xs text-gray-400 before:mr-2 before:text-zen-sage before:content-['✓']"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm font-semibold text-zen-cyan">
                  {PRO_PRICE_SOL} SOL / {PRO_PERIOD_DAYS} days
                </p>
                <button
                  type="button"
                  onClick={() => void handlePro()}
                  disabled={!isSignedIn || loadingProduct !== null || Boolean(success)}
                  className="btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingProduct === "pro"
                    ? "Approve in wallet…"
                    : `Pay ${PRO_PRICE_SOL} SOL for Pro`}
                </button>
              </div>
            </div>
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
            {!isSignedIn && !isPro ? (
              <button
                type="button"
                onClick={beginConnect}
                disabled={connecting}
                className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {connecting ? "Signing…" : "Connect Wallet"}
              </button>
            ) : (
              <button type="button" onClick={onClose} className="btn-primary flex-1">
                {success || isPro ? "Done" : "Close"}
              </button>
            )}
            {isSignedIn && !success && !isPro && (
              <button type="button" onClick={onClose} className="btn-ghost sm:px-6">
                Close
              </button>
            )}
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