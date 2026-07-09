import { getCachedOrFetch } from "@/lib/cache";
import { normalizeTokenLpInfo } from "@/lib/dexscreener";
import { hasDatabase } from "@/lib/config";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import {
  fetchTokenChainData,
  hasHeliusApiKey,
} from "@/lib/helius/index";
import type { TokenChainData } from "@/lib/helius/index";
import { mockTokenChainData } from "@/lib/mock-data";

export const TOKEN_CACHE_KEY_PREFIX = "token:v4:";

function tokenCacheKey(mintAddress: string): string {
  return `${TOKEN_CACHE_KEY_PREFIX}${mintAddress}`;
}

async function fetchLiveToken(mintAddress: string): Promise<TokenChainData> {
  if (hasHeliusApiKey()) {
    return fetchTokenChainData(mintAddress);
  }
  return mockTokenChainData(mintAddress);
}

async function persistToken(data: TokenChainData): Promise<void> {
  if (!hasDatabase()) return;

  await withDbFallback(
    () =>
      prisma.token.upsert({
        where: { mintAddress: data.mintAddress },
        create: {
          mintAddress: data.mintAddress,
          creatorWallet: data.creatorWallet,
          supply: data.supply,
          mintAuthority: data.mintAuthority,
          freezeAuthority: data.freezeAuthority,
          holderCount: data.holderCount,
          cachedAt: new Date(),
        },
        update: {
          creatorWallet: data.creatorWallet,
          supply: data.supply,
          mintAuthority: data.mintAuthority,
          freezeAuthority: data.freezeAuthority,
          holderCount: data.holderCount,
          cachedAt: new Date(),
        },
      }),
    undefined,
    `token persist (${data.mintAddress})`
  );
}

export async function getTokenData(
  mintAddress: string
): Promise<{ data: TokenChainData; source: "redis" | "postgres" | "live" }> {
  const result = await getCachedOrFetch(
    tokenCacheKey(mintAddress),
    () => fetchLiveToken(mintAddress)
  );

  if (result.source === "live") {
    await persistToken(result.data);
  }

  return {
    ...result,
    data: {
      ...result.data,
      lp: normalizeTokenLpInfo(result.data.lp),
    },
  };
}