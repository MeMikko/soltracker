import { hasDatabase } from "@/lib/config";
import {
  memoryCacheGet,
  memoryCacheSet,
} from "@/lib/dev/memory-store";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import type { CacheEnvelope, PostgresCacheAdapter } from "./types";

function createMemoryPostgresAdapter(): PostgresCacheAdapter {
  return {
    async get<T>(key: string): Promise<CacheEnvelope<T> | null> {
      return memoryCacheGet<T>(key);
    },
    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
      memoryCacheSet(key, value, ttlSeconds);
    },
  };
}

function createPrismaPostgresAdapter(): PostgresCacheAdapter {
  return {
    async get<T>(key: string): Promise<CacheEnvelope<T> | null> {
      return withDbFallback(
        async () => {
          const entry = await prisma.cacheEntry.findUnique({ where: { key } });
          if (!entry || entry.expiresAt <= new Date()) {
            return null;
          }

          return {
            data: entry.value as T,
            cachedAt: entry.cachedAt.toISOString(),
          };
        },
        null,
        `cache read (${key})`
      );
    },

    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
      await withDbFallback(
        async () => {
          const now = new Date();
          const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

          await prisma.cacheEntry.upsert({
            where: { key },
            create: {
              key,
              value: value as object,
              cachedAt: now,
              expiresAt,
            },
            update: {
              value: value as object,
              cachedAt: now,
              expiresAt,
            },
          });
        },
        undefined,
        `cache write (${key})`
      );
    },
  };
}

export function createPostgresCacheAdapter(): PostgresCacheAdapter {
  if (!hasDatabase()) {
    return createMemoryPostgresAdapter();
  }
  return createPrismaPostgresAdapter();
}