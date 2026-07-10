import Link from "next/link";
import { truncateAddress } from "@/lib/format";
import type { WalletWarningInfo } from "@/lib/types";

interface WalletWarningBannerProps {
  warning: WalletWarningInfo;
  context: "creator" | "wallet";
}

export function WalletWarningBanner({
  warning,
  context,
}: WalletWarningBannerProps) {
  const title =
    context === "creator"
      ? "Flagged token creator"
      : "Flagged wallet";

  const description =
    context === "creator"
      ? "This token's creator wallet is on the Zenerating warning list for prior malicious activity."
      : "This wallet is on the Zenerating warning list for prior malicious activity.";

  return (
    <div className="rounded-2xl border border-accent-red/35 bg-accent-red/10 px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-accent-red">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-300">
            {description}
          </p>
          {warning.note && (
            <p className="mt-2 rounded-lg border border-accent-red/20 bg-zen-deep/50 px-3 py-2 text-xs leading-relaxed text-gray-400">
              {warning.note}
            </p>
          )}
          <p className="mt-2 font-mono text-[10px] text-gray-500">
            {truncateAddress(warning.wallet, 8)} · flagged{" "}
            {new Date(warning.addedAt).toLocaleDateString()}
          </p>
        </div>
        <Link
          href={`/results/${encodeURIComponent(warning.wallet)}?type=wallet`}
          className="btn-ghost shrink-0 self-start px-3 py-2 text-xs"
        >
          View wallet
        </Link>
      </div>
    </div>
  );
}