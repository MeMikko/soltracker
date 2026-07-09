import type { TokenLpInfo } from "./helius/types";

const DEXSCREENER_BASE = "https://api.dexscreener.com/latest/dex/tokens";

interface DexScreenerPair {
  chainId?: string;
  dexId?: string;
  pairAddress?: string;
  priceUsd?: string | number;
  marketCap?: number;
  fdv?: number;
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[];
}

export const EMPTY_TOKEN_LP: TokenLpInfo = {
  hasLp: false,
  poolAddress: null,
  liquidityUsd: null,
  dex: null,
  priceUsd: null,
  marketCapUsd: null,
  priceChange24h: null,
};

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeTokenLpInfo(
  lp: Partial<TokenLpInfo> | null | undefined
): TokenLpInfo {
  if (!lp) {
    return { ...EMPTY_TOKEN_LP };
  }

  return {
    hasLp: Boolean(lp.hasLp),
    poolAddress: lp.poolAddress ?? null,
    liquidityUsd: finiteOrNull(lp.liquidityUsd),
    dex: lp.dex ?? null,
    priceUsd: finiteOrNull(lp.priceUsd),
    marketCapUsd: finiteOrNull(lp.marketCapUsd),
    priceChange24h: finiteOrNull(lp.priceChange24h),
  };
}

function parsePriceUsd(value: string | number | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickBestPair(pairs: DexScreenerPair[]): DexScreenerPair | null {
  if (pairs.length === 0) return null;

  return pairs.reduce((top, pair) =>
    (pair.liquidity?.usd ?? 0) > (top.liquidity?.usd ?? 0) ? pair : top
  );
}

export async function fetchTokenLpInfo(mintAddress: string): Promise<TokenLpInfo> {
  try {
    const response = await fetch(`${DEXSCREENER_BASE}/${mintAddress}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return { ...EMPTY_TOKEN_LP };
    }

    const payload = (await response.json()) as DexScreenerResponse;
    const pairs = (payload.pairs ?? []).filter(
      (pair) => pair.chainId === "solana" && typeof pair.pairAddress === "string"
    );

    const best = pickBestPair(
      pairs.filter((pair) => typeof pair.liquidity?.usd === "number")
    );

    if (!best) {
      const priced = pickBestPair(
        pairs.filter((pair) => parsePriceUsd(pair.priceUsd) !== null)
      );
      if (!priced) return { ...EMPTY_TOKEN_LP };

      return {
        hasLp: false,
        poolAddress: priced.pairAddress ?? null,
        liquidityUsd: priced.liquidity?.usd ?? null,
        dex: priced.dexId ?? null,
        priceUsd: parsePriceUsd(priced.priceUsd),
        marketCapUsd: priced.marketCap ?? priced.fdv ?? null,
        priceChange24h: priced.priceChange?.h24 ?? null,
      };
    }

    return {
      hasLp: true,
      poolAddress: best.pairAddress ?? null,
      liquidityUsd: best.liquidity?.usd ?? null,
      dex: best.dexId ?? null,
      priceUsd: parsePriceUsd(best.priceUsd),
      marketCapUsd: best.marketCap ?? best.fdv ?? null,
      priceChange24h: best.priceChange?.h24 ?? null,
    };
  } catch {
    return { ...EMPTY_TOKEN_LP };
  }
}