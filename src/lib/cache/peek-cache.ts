import { createPostgresCacheAdapter } from "./postgres-store";
import { createRedisCacheAdapter } from "./redis-store";
import {
  DEFAULT_CACHE_TTL_SECONDS,
  type CacheLayerOptions,
} from "./get-cached-or-fetch";
import type { CacheResult } from "./types";

export async function peekCacheResult<T>(
  key: string,
  options: CacheLayerOptions = {}
): Promise<CacheResult<T> | null> {
  const ttlSeconds = options.ttlSeconds ?? DEFAULT_CACHE_TTL_SECONDS;
  const redis = options.redis ?? createRedisCacheAdapter();
  const postgres = options.postgres ?? createPostgresCacheAdapter();

  if (redis) {
    const redisHit = await redis.get<T>(key);
    if (redisHit) {
      return { data: redisHit.data, source: "redis" };
    }
  }

  const postgresHit = await postgres.get<T>(key);
  if (postgresHit) {
    if (redis) {
      await redis.set(key, postgresHit.data, ttlSeconds);
    }
    return { data: postgresHit.data, source: "postgres" };
  }

  return null;
}

export async function peekCache<T>(
  key: string,
  options: CacheLayerOptions = {}
): Promise<T | null> {
  const hit = await peekCacheResult<T>(key, options);
  return hit?.data ?? null;
}