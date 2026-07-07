import { Redis } from "@upstash/redis";

let redisClient: Redis | null = null;

export function hasRedisConfig(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN
  );
}

export function getRedis(): Redis | null {
  if (!hasRedisConfig()) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_URL!,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    });
  }

  return redisClient;
}