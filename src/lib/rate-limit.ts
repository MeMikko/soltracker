import { getRedis } from "@/lib/cache/redis";
import { WalletAuthRequiredError } from "@/lib/auth/errors";
import {
  getWalletFromRequest,
  isWalletAuthDisabled,
} from "@/lib/auth/wallet-auth";
import { hasDatabase } from "@/lib/config";
import {
  memoryGetSearchCount,
  memoryIncrementSearchCount,
  memoryTryClaimBilledSearch,
} from "@/lib/dev/memory-store";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import type { UsageResponse } from "@/lib/types";

export const FREE_DAILY_LIMIT = 5;
const SECONDS_PER_DAY = 86_400;
const BILLED_SEARCH_TTL_SECONDS = 12 * 60;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function redisUsageKey(identifier: string, date: string): string {
  return `ratelimit:search:${identifier}:${date}`;
}

function billedSearchKey(
  identifier: string,
  address: string,
  date: string
): string {
  return `ratelimit:billed:${identifier}:${address}:${date}`;
}

function getLegacyIdentifier(request: Request): string {
  const sessionId = request.headers.get("x-session-id");
  if (sessionId?.trim()) {
    return `session:${sessionId.trim()}`;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "anonymous";

  return `ip:${ip}`;
}

export function getRequestIdentifier(request: Request): string {
  const wallet = getWalletFromRequest(request);
  if (wallet) {
    return `wallet:${wallet}`;
  }

  if (isWalletAuthDisabled()) {
    return getLegacyIdentifier(request);
  }

  throw new WalletAuthRequiredError();
}

function buildUsage(used: number, wallet: string | null): UsageResponse {
  return {
    used,
    limit: FREE_DAILY_LIMIT,
    remaining: Math.max(0, FREE_DAILY_LIMIT - used),
    tier: "free",
    wallet,
    authenticated: wallet !== null || isWalletAuthDisabled(),
  };
}

async function getSearchCount(identifier: string, date: string): Promise<number> {
  const redis = getRedis();

  if (redis) {
    const cached = await redis.get<number>(redisUsageKey(identifier, date));
    if (cached !== null && cached !== undefined) {
      return Number(cached);
    }
  }

  let used: number;

  if (hasDatabase()) {
    used = await withDbFallback(
      async () => {
        const log = await prisma.searchLog.findUnique({
          where: { identifier_date: { identifier, date } },
        });
        return log?.count ?? 0;
      },
      memoryGetSearchCount(identifier, date),
      `search count (${identifier})`
    );
  } else {
    used = memoryGetSearchCount(identifier, date);
  }

  if (redis && used > 0) {
    await redis.set(redisUsageKey(identifier, date), used, {
      ex: SECONDS_PER_DAY,
    });
  }

  return used;
}

async function incrementSearchCount(
  identifier: string,
  date: string
): Promise<number> {
  let used: number;

  if (hasDatabase()) {
    used = await withDbFallback(
      async () => {
        const log = await prisma.searchLog.upsert({
          where: { identifier_date: { identifier, date } },
          create: { identifier, date, count: 1 },
          update: { count: { increment: 1 } },
        });
        return log.count;
      },
      memoryIncrementSearchCount(identifier, date),
      `search increment (${identifier})`
    );
  } else {
    used = memoryIncrementSearchCount(identifier, date);
  }

  const redis = getRedis();
  if (redis) {
    await redis.set(redisUsageKey(identifier, date), used, {
      ex: SECONDS_PER_DAY,
    });
  }

  return used;
}

export async function getSearchUsage(
  request: Request
): Promise<UsageResponse> {
  const wallet = getWalletFromRequest(request);
  if (!wallet && !isWalletAuthDisabled()) {
    return buildUsage(0, null);
  }

  const identifier = getRequestIdentifier(request);
  const used = await getSearchCount(identifier, todayKey());
  return buildUsage(used, wallet);
}

async function tryClaimBilledSearch(
  identifier: string,
  address: string,
  date: string
): Promise<boolean> {
  const key = billedSearchKey(identifier, address, date);
  const redis = getRedis();

  if (redis) {
    const claimed = await redis.set(key, "1", {
      nx: true,
      ex: BILLED_SEARCH_TTL_SECONDS,
    });
    return claimed === "OK";
  }

  return memoryTryClaimBilledSearch(key, BILLED_SEARCH_TTL_SECONDS);
}

/**
 * Bills at most once per wallet + target address while the cache window is warm.
 * Prevents parallel /search + /risk calls from spending multiple daily searches.
 */
export async function consumeSearchForAddress(
  request: Request,
  address: string
): Promise<UsageResponse> {
  const identifier = getRequestIdentifier(request);
  const date = todayKey();
  const shouldBill = await tryClaimBilledSearch(identifier, address, date);

  if (!shouldBill) {
    return getSearchUsage(request);
  }

  return consumeSearch(request);
}

export async function consumeSearch(
  request: Request
): Promise<UsageResponse> {
  const identifier = getRequestIdentifier(request);
  const wallet = getWalletFromRequest(request);

  const current = await getSearchUsage(request);
  if (current.remaining === 0) {
    return current;
  }

  const used = await incrementSearchCount(identifier, todayKey());
  return buildUsage(used, wallet);
}

export function canSearch(usage: UsageResponse): boolean {
  return usage.authenticated && usage.remaining > 0;
}

export class RateLimitExceededError extends Error {
  readonly usage: UsageResponse;

  constructor(usage: UsageResponse) {
    super("Daily search limit exceeded");
    this.name = "RateLimitExceededError";
    this.usage = usage;
  }
}

/**
 * Enforces the daily search quota before a live Helius fetch.
 *
 * Tradeoff: cache hits (Redis or Postgres) are intentionally free — they never
 * reach Helius and should not consume a user's daily allowance. Only live fetches
 * call `consumeSearch` after this guard passes.
 */
export async function assertCanSearch(request: Request): Promise<UsageResponse> {
  const usage = await getSearchUsage(request);

  if (!usage.authenticated) {
    throw new WalletAuthRequiredError();
  }

  if (!canSearch(usage)) {
    throw new RateLimitExceededError(usage);
  }

  return usage;
}