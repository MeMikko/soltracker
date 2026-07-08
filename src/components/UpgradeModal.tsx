"use client";

import { useState } from "react";
import { activateProPayment } from "@/lib/api-client";
import { truncateAddress } from "@/lib/format";
import {
  PRO_PERIOD_DAYS,
  PRO_PRICE_SOL,
  PRO_TREASURY_WALLET,
} from "@/lib/pro/config";
import { sendProSubscriptionPayment } from "@/lib/wallet/send-sol";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const signature = await sendProSubscriptionPayment();

      let lastError = "Payment verification failed";
      for (let attempt = 0; attempt < 6; attempt += 1) {
        if (attempt > 0) await sleep(2000);

        const result = await activateProPayment(signature);
        if (result.ok) {
          setSuccess(
            `Pro active until ${new Date(result.data.pro.expiresAt!).toLocaleDateString()}`
          );
          window.dispatchEvent(new CustomEvent("usage-changed"));
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
          Upgrade to Pro
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Pay{" "}
          <span className="font-semibold text-white">
            {PRO_PRICE_SOL} SOL
          </span>{" "}
          per {PRO_PERIOD_DAYS} days for unlimited searches and full
          intelligence access.
        </p>

        <div className="mt-4 rounded-lg border border-zen-border bg-zen-deep/80 px-3 py-2.5 text-xs text-gray-500">
          <p>
            Payment sent to{" "}
            <span className="font-mono text-zen-mist">
              {truncateAddress(PRO_TREASURY_WALLET, 6)}
            </span>
          </p>
          <p className="mt-1">Your connected wallet signs the transfer in-browser.</p>
        </div>

        <ul className="mt-5 space-y-2.5">
          {FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2.5 text-sm text-gray-300"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zen-sage/15 text-zen-sage">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
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
          <button
            type="button"
            onClick={() => void handleUpgrade()}
            disabled={loading || Boolean(success)}
            className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Confirming payment…"
              : `Pay ${PRO_PRICE_SOL} SOL / month`}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost sm:px-6">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}