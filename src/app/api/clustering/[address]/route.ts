import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-error";
import { peekCacheResult } from "@/lib/cache/peek-cache";
import { getWalletCluster } from "@/lib/data/cluster-service";
import {
  assertCanSearch,
  consumeSearchForAddress,
  getSearchUsage,
} from "@/lib/rate-limit";
import type { ClusterGraph } from "@/lib/clustering/types";
import type { UsageResponse } from "@/lib/types";
import { parseSolanaAddress } from "@/lib/validation";

export const maxDuration = 30;

const CLUSTER_CACHE_PREFIX = "cluster:v1:";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address: raw } = await params;
    const address = parseSolanaAddress(decodeURIComponent(raw));
    const cacheKey = `${CLUSTER_CACHE_PREFIX}${address}`;

    const cached = await peekCacheResult<ClusterGraph>(cacheKey);
    let usage: UsageResponse;

    if (cached) {
      usage = await getSearchUsage(request);
      return NextResponse.json({
        ...cached.data,
        source: cached.source,
        usage,
      });
    }

    await assertCanSearch(request);
    const result = await getWalletCluster(address);

    usage =
      result.source === "live"
        ? await consumeSearchForAddress(request, address)
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