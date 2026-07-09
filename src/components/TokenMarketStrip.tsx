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

function hasFiniteValue(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function TokenMarketStrip({ lp }: TokenMarketStripProps) {
  const priceUsd = hasFiniteValue(lp.priceUsd) ? lp.priceUsd : null;
  const marketCapUsd = hasFiniteValue(lp.marketCapUsd) ? lp.marketCapUsd : null;
  const priceChange24h = hasFiniteValue(lp.priceChange24h)
    ? lp.priceChange24h
    : null;

  if (priceUsd === null && marketCapUsd === null && priceChange24h === null) {
    return (
      <p className="mt-2 text-xs text-gray-600">
        Market price unavailable — token may still be on a bonding curve.
      </p>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
      {priceUsd !== null && (
        <span>
          <span className="text-gray-600">Price </span>
          <span className="font-mono font-medium text-white">
            {formatUsdPrice(priceUsd)}
          </span>
        </span>
      )}
      {marketCapUsd !== null && (
        <span>
          <span className="text-gray-600">MC </span>
          <span className="font-mono font-medium text-zen-mist">
            {formatUsdCompact(marketCapUsd)}
          </span>
        </span>
      )}
      {priceChange24h !== null && (
        <span>
          <span className="text-gray-600">24h </span>
          <span
            className={`font-mono font-medium ${changeColorClass(priceChange24h)}`}
          >
            {formatPercentChange(priceChange24h)}
          </span>
        </span>
      )}
    </div>
  );
}