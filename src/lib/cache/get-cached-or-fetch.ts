import { createPostgresCacheAdapter } from "./postgres-store";
import { createRedisCacheAdapter } from "./redis-store";
import type {
  CacheResult,
  PostgresCacheAdapter,
  RedisCacheAdapter,
} from "./types";

export const DEFAULT_CACHE_TTL_SECONDS = 12 * 60;

export interface CacheLayerOptions {
  ttlSeconds?: number;
  redis?: RedisCacheAdapter | null;
  postgres?: PostgresCacheAdapter;
}

export async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheLayerOptions = {}
): Promise<CacheResult<T>> {
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

  const liveData = await fetchFn();

  await Promise.all([
    postgres.set(key, liveData, ttlSeconds),
    redis ? redis.set(key, liveData, ttlSeconds) : Promise.resolve(),
  ]);

  return { data: liveData, source: "live" };
}