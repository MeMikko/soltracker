import { getCachedOrFetch } from "@/lib/cache";
import { hasHeliusApiKey } from "@/lib/helius/index";
import {
  buildDeployerReputation,
  mockDeployerReputation,
  type DeployerReputation,
} from "@/lib/token/deployer-reputation";
import {
  fetchHolderAnalytics,
  mockHolderAnalytics,
  type HolderAnalytics,
} from "@/lib/token/holder-analytics";
import { getTokenData } from "./token-service";

export const TOKEN_ANALYTICS_CACHE_PREFIX = "token:analytics:v1:";

export interface TokenAnalytics {
  mint: string;
  holders: HolderAnalytics;
  deployer: DeployerReputation | null;
}

function analyticsCacheKey(mint: string): string {
  return `${TOKEN_ANALYTICS_CACHE_PREFIX}${mint}`;
}

async function fetchLiveAnalytics(mint: string): Promise<TokenAnalytics> {
  const tokenResult = await getTokenData(mint);
  const token = tokenResult.data;

  if (!hasHeliusApiKey()) {
    return {
      mint,
      holders: mockHolderAnalytics(mint, token.holderCount),
      deployer: token.creatorWallet
        ? mockDeployerReputation(token.creatorWallet, mint)
        : null,
    };
  }

  const [holders, deployer] = await Promise.all([
    fetchHolderAnalytics({
      mintAddress: mint,
      supplyRaw: token.supply,
      decimals: token.decimals,
      holderCount: token.holderCount,
    }),
    buildDeployerReputation(token.creatorWallet, mint),
  ]);

  return { mint, holders, deployer };
}

export async function getTokenAnalytics(
  mint: string
): Promise<{ data: TokenAnalytics; source: "redis" | "postgres" | "live" }> {
  return getCachedOrFetch(analyticsCacheKey(mint), () => fetchLiveAnalytics(mint));
}