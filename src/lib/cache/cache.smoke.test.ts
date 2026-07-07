import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCachedOrFetch } from "./get-cached-or-fetch";
import type {
  CacheEnvelope,
  PostgresCacheAdapter,
  RedisCacheAdapter,
} from "./types";

class MemoryRedisAdapter implements RedisCacheAdapter {
  private store = new Map<string, string>();

  async get<T>(key: string): Promise<CacheEnvelope<T> | null> {
    const raw = this.store.get(key);
    return raw ? (JSON.parse(raw) as CacheEnvelope<T>) : null;
  }

  async set<T>(key: string, value: T, _ttlSeconds: number): Promise<void> {
    const envelope: CacheEnvelope<T> = {
      data: value,
      cachedAt: new Date().toISOString(),
    };
    this.store.set(key, JSON.stringify(envelope));
  }
}

class MemoryPostgresAdapter implements PostgresCacheAdapter {
  private store = new Map<string, CacheEnvelope<unknown>>();

  async get<T>(key: string): Promise<CacheEnvelope<T> | null> {
    const hit = this.store.get(key);
    return hit ? (hit as CacheEnvelope<T>) : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.store.set(key, {
      data: value,
      cachedAt: new Date().toISOString(),
    });
  }
}

describe("getCachedOrFetch", () => {
  it("fetches live data on cache miss and serves redis on subsequent hit", async () => {
    const redis = new MemoryRedisAdapter();
    const postgres = new MemoryPostgresAdapter();
    let fetchCount = 0;

    const fetchFn = async () => {
      fetchCount += 1;
      return { balance: 1.5, txCount: 42 };
    };

    const miss = await getCachedOrFetch("wallet:test", fetchFn, {
      ttlSeconds: 600,
      redis,
      postgres,
    });

    assert.equal(miss.source, "live");
    assert.equal(miss.data.balance, 1.5);
    assert.equal(fetchCount, 1);

    const hit = await getCachedOrFetch("wallet:test", fetchFn, {
      ttlSeconds: 600,
      redis,
      postgres,
    });

    assert.equal(hit.source, "redis");
    assert.equal(hit.data.txCount, 42);
    assert.equal(fetchCount, 1, "fetchFn should not run on cache hit");
  });

  it("falls back to postgres when redis is empty", async () => {
    const redis = new MemoryRedisAdapter();
    const postgres = new MemoryPostgresAdapter();
    let fetchCount = 0;

    await postgres.set("token:test", { holderCount: 99 }, 600);

    const result = await getCachedOrFetch(
      "token:test",
      async () => {
        fetchCount += 1;
        return { holderCount: 1 };
      },
      { ttlSeconds: 600, redis, postgres }
    );

    assert.equal(result.source, "postgres");
    assert.equal(result.data.holderCount, 99);
    assert.equal(fetchCount, 0);

    const redisHit = await getCachedOrFetch(
      "token:test",
      async () => {
        fetchCount += 1;
        return { holderCount: 1 };
      },
      { ttlSeconds: 600, redis, postgres }
    );

    assert.equal(redisHit.source, "redis");
    assert.equal(fetchCount, 0);
  });
});