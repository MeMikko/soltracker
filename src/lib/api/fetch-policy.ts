import { peekCacheResult } from "@/lib/cache/peek-cache";
import {
  getWalletData,
  getTokenData,
  getTokenAnalytics,
  TOKEN_CACHE_KEY_PREFIX,
  TOKEN_ANALYTICS_CACHE_PREFIX,
} from "@/lib/data";
import type { TokenAnalytics } from "@/lib/data/token-analytics-service";
import type { TokenChainData, WalletChainData } from "@/lib/helius/index";
import {
  assertCanSearch,
  consumeSearchForAddress,
  getSearchUsage,
} from "@/lib/rate-limit";
import type { UsageResponse } from "@/lib/types";
import type { CacheSource } from "@/lib/cache";

interface FetchResult<T> {
  data: T;
  source: CacheSource;
  usage: UsageResponse;
}

function targetAddressFromCacheKey(cacheKey: string): string {
  if (cacheKey.startsWith(TOKEN_ANALYTICS_CACHE_PREFIX)) {
    return cacheKey.slice(TOKEN_ANALYTICS_CACHE_PREFIX.length);
  }

  if (cacheKey.startsWith(TOKEN_CACHE_KEY_PREFIX)) {
    return cacheKey.slice(TOKEN_CACHE_KEY_PREFIX.length);
  }

  return cacheKey.replace(/^wallet:/, "");
}

async function resolveWithRateLimit<T>(
  cacheKey: string,
  request: Request,
  fetchLive: () => Promise<{ data: T; source: CacheSource }>
): Promise<FetchResult<T>> {
  const cached = await peekCacheResult<T>(cacheKey);
  if (cached) {
    return {
      data: cached.data,
      source: cached.source,
      usage: await getSearchUsage(request),
    };
  }

  await assertCanSearch(request);
  const result = await fetchLive();

  const usage =
    result.source === "live"
      ? await consumeSearchForAddress(
          request,
          targetAddressFromCacheKey(cacheKey)
        )
      : await getSearchUsage(request);

  return { data: result.data, source: result.source, usage };
}

export async function fetchWalletWithPolicy(
  address: string,
  request: Request
): Promise<FetchResult<WalletChainData>> {
  return resolveWithRateLimit(`wallet:${address}`, request, () =>
    getWalletData(address)
  );
}

export async function fetchTokenWithPolicy(
  mint: string,
  request: Request
): Promise<FetchResult<TokenChainData>> {
  return resolveWithRateLimit(`${TOKEN_CACHE_KEY_PREFIX}${mint}`, request, () =>
    getTokenData(mint)
  );
}

export async function fetchTokenAnalyticsWithPolicy(
  mint: string,
  request: Request
): Promise<FetchResult<TokenAnalytics>> {
  return resolveWithRateLimit(
    `${TOKEN_ANALYTICS_CACHE_PREFIX}${mint}`,
    request,
    () => getTokenAnalytics(mint)
  );
}