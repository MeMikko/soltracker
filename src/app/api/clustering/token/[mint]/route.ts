import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-error";
import { peekCacheResult } from "@/lib/cache/peek-cache";
import type { ClusterGraph } from "@/lib/clustering/types";
import { TOKEN_CACHE_KEY_PREFIX, getTokenData } from "@/lib/data";
import { getTokenCreatorCluster } from "@/lib/data/cluster-service";
import { assertProOrTokenUnlock } from "@/lib/pro/access";
import {
  assertCanSearch,
  consumeSearchForAddress,
  getSearchUsage,
} from "@/lib/rate-limit";
import type { UsageResponse } from "@/lib/types";
import type { TokenChainData } from "@/lib/helius/index";
import { parseSolanaAddress } from "@/lib/validation";

export const maxDuration = 60;

const TOKEN_CLUSTER_CACHE_PREFIX = "cluster:v2:token:";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mint: string }> }
) {
  try {
    const { mint: raw } = await params;
    const mintAddress = parseSolanaAddress(decodeURIComponent(raw));
    await assertProOrTokenUnlock(request, mintAddress);

    const cacheKey = `${TOKEN_CLUSTER_CACHE_PREFIX}${mintAddress}`;

    const clusterCached = await peekCacheResult<ClusterGraph>(cacheKey);
    let usage: UsageResponse;

    if (clusterCached) {
      usage = await getSearchUsage(request);
      return NextResponse.json({
        ...clusterCached.data,
        source: clusterCached.source,
        usage,
      });
    }

    await assertCanSearch(request);

    const tokenCached = await peekCacheResult<TokenChainData>(
      `${TOKEN_CACHE_KEY_PREFIX}${mintAddress}`
    );
    const tokenData =
      tokenCached?.data ?? (await getTokenData(mintAddress)).data;

    const result = await getTokenCreatorCluster({
      mintAddress,
      creatorWallet: tokenData.creatorWallet,
      symbol: tokenData.symbol,
      name: tokenData.name,
    });

    usage =
      result.source === "live"
        ? await consumeSearchForAddress(request, mintAddress)
        : await getSearchUsage(request);

    return NextResponse.json({
      ...result.data,
      source: result.source,
      usage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}