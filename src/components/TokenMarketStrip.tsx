import {
  formatPercentChange,
  formatUsdCompact,
  formatUsdPrice,
} from "@/lib/format";
import type { TokenLpInfo } from "@/lib/types";

interface TokenMarketStripProps {
  lp: TokenLpInfo;
}

function changeColorClass(value: number): string {
  if (value > 0) return "text-zen-sage";
  if (value < 0) return "text-accent-red";
  return "text-gray-500";
}

export function TokenMarketStrip({ lp }: TokenMarketStripProps) {
  const hasPrice = lp.priceUsd !== null;
  const hasMarketCap = lp.marketCapUsd !== null;
  const hasChange = lp.priceChange24h !== null;

  if (!hasPrice && !hasMarketCap && !hasChange) {
    return (
      <p className="mt-2 text-xs text-gray-600">
        Market price unavailable — token may still be on a bonding curve.
      </p>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
      {hasPrice && (
        <span>
          <span className="text-gray-600">Price </span>
          <span className="font-mono font-medium text-white">
            {formatUsdPrice(lp.priceUsd!)}
          </span>
        </span>
      )}
      {hasMarketCap && (
        <span>
          <span className="text-gray-600">MC </span>
          <span className="font-mono font-medium text-zen-mist">
            {formatUsdCompact(lp.marketCapUsd!)}
          </span>
        </span>
      )}
      {hasChange && (
        <span>
          <span className="text-gray-600">24h </span>
          <span
            className={`font-mono font-medium ${changeColorClass(lp.priceChange24h!)}`}
          >
            {formatPercentChange(lp.priceChange24h!)}
          </span>
        </span>
      )}
    </div>
  );
}