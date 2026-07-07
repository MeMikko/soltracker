import { getCachedOrFetch } from "@/lib/cache";
import { hasDatabase } from "@/lib/config";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import {
  fetchWalletChainData,
  hasHeliusApiKey,
} from "@/lib/helius/index";
import type { WalletChainData } from "@/lib/helius/index";
import { mockWalletChainData } from "@/lib/mock-data";

function walletCacheKey(address: string): string {
  return `wallet:${address}`;
}

async function fetchLiveWallet(address: string): Promise<WalletChainData> {
  if (hasHeliusApiKey()) {
    return fetchWalletChainData(address);
  }
  return mockWalletChainData(address);
}

async function persistWallet(data: WalletChainData): Promise<void> {
  if (!hasDatabase()) return;

  await withDbFallback(
    () =>
      prisma.wallet.upsert({
        where: { address: data.address },
        create: {
          address: data.address,
          firstSeenAt: data.firstSeenAt,
          lastSeenAt: data.lastSeenAt,
          solBalance: data.solBalance,
          txCount: data.txCount,
          cachedAt: new Date(),
        },
        update: {
          firstSeenAt: data.firstSeenAt,
          lastSeenAt: data.lastSeenAt,
          solBalance: data.solBalance,
          txCount: data.txCount,
          cachedAt: new Date(),
        },
      }),
    undefined,
    `wallet persist (${data.address})`
  );
}

export async function getWalletData(
  address: string
): Promise<{ data: WalletChainData; source: "redis" | "postgres" | "live" }> {
  const result = await getCachedOrFetch(
    walletCacheKey(address),
    () => fetchLiveWallet(address)
  );

  if (result.source === "live") {
    await persistWallet(result.data);
  }

  return result;
}