export type CacheSource = "redis" | "postgres" | "live";

export interface CacheResult<T> {
  data: T;
  source: CacheSource;
}

export interface CacheEnvelope<T> {
  data: T;
  cachedAt: string;
}

export interface PostgresCacheAdapter {
  get<T>(key: string): Promise<CacheEnvelope<T> | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}

export interface RedisCacheAdapter {
  get<T>(key: string): Promise<CacheEnvelope<T> | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
}