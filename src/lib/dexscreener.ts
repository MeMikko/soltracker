import type { TokenLpInfo } from "./helius/types";

const DEXSCREENER_BASE = "https://api.dexscreener.com/latest/dex/tokens";

interface DexScreenerPair {
  chainId?: string;
  dexId?: string;
  pairAddress?: string;
  liquidity?: { usd?: number };
}

interface DexScreenerResponse {
  pairs?: DexScreenerPair[];
}

const EMPTY_LP: TokenLpInfo = {
  hasLp: false,
  poolAddress: null,
  liquidityUsd: null,
  dex: null,
};

export async function fetchTokenLpInfo(mintAddress: string): Promise<TokenLpInfo> {
  try {
    const response = await fetch(`${DEXSCREENER_BASE}/${mintAddress}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return EMPTY_LP;
    }

    const payload = (await response.json()) as DexScreenerResponse;
    const pairs = (payload.pairs ?? []).filter(
      (pair) =>
        pair.chainId === "solana" &&
        typeof pair.pairAddress === "string" &&
        typeof pair.liquidity?.usd === "number"
    );

    if (pairs.length === 0) {
      return EMPTY_LP;
    }

    const best = pairs.reduce((top, pair) =>
      (pair.liquidity?.usd ?? 0) > (top.liquidity?.usd ?? 0) ? pair : top
    );

    return {
      hasLp: true,
      poolAddress: best.pairAddress ?? null,
      liquidityUsd: best.liquidity?.usd ?? null,
      dex: best.dexId ?? null,
    };
  } catch {
    return EMPTY_LP;
  }
}