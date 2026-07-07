import { getRedis } from "./redis";
import type { CacheEnvelope, RedisCacheAdapter } from "./types";

export function createRedisCacheAdapter(): RedisCacheAdapter | null {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  return {
    async get<T>(key: string): Promise<CacheEnvelope<T> | null> {
      const raw = await redis.get<string>(key);
      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as CacheEnvelope<T>;
    },

    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
      const envelope: CacheEnvelope<T> = {
        data: value,
        cachedAt: new Date().toISOString(),
      };

      await redis.set(key, JSON.stringify(envelope), { ex: ttlSeconds });
    },
  };
}