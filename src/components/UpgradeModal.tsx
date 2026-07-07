"use client";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const FEATURES = [
  "Unlimited daily searches",
  "Holder distribution metrics",
  "Full LP and whale analysis",
  "Priority on-chain indexing",
];

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
      onClick={onClose}
    >
      <div
        className="crypto-card w-full max-w-md border-solana-purple/20 p-6 shadow-glow sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-solana text-sm font-bold text-surface">
          Pro
        </div>
        <h2 id="upgrade-title" className="mt-4 text-xl font-bold text-white">
          Upgrade to Pro
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Unlock unlimited searches, holder distribution analytics, and full
          risk breakdowns. Payment integration coming soon.
        </p>
        <ul className="mt-5 space-y-2.5">
          {FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2.5 text-sm text-gray-300"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-solana-green/10 text-solana-green">
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
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:gap-3">
          <button
            type="button"
            disabled
            className="btn-primary flex-1 cursor-not-allowed opacity-50"
          >
            Upgrade — Coming Soon
          </button>
          <button type="button" onClick={onClose} className="btn-ghost sm:px-6">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}