export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatSupply(supply: number, decimals: number): string {
  const adjusted = supply / Math.pow(10, decimals);
  return formatNumber(adjusted, decimals > 6 ? 2 : 0);
}

export function formatUsdPrice(price: number): string {
  if (price >= 1) {
    return `$${formatNumber(price, 2)}`;
  }
  if (price >= 0.01) {
    return `$${formatNumber(price, 4)}`;
  }
  if (price >= 0.0001) {
    return `$${formatNumber(price, 6)}`;
  }
  return `$${price.toPrecision(3)}`;
}

export function formatUsdCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `$${formatNumber(value / 1_000_000_000, 2)}B`;
  }
  if (abs >= 1_000_000) {
    return `$${formatNumber(value / 1_000_000, 2)}M`;
  }
  if (abs >= 1_000) {
    return `$${formatNumber(value / 1_000, 1)}K`;
  }
  return `$${formatNumber(value, 0)}`;
}

export function formatPercentChange(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, 1)}%`;
}