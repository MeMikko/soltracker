import { getRedis } from "@/lib/cache/redis";
import { isAdminWallet } from "@/lib/auth/admin-wallets";
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
import { getSearchPackBalance } from "@/lib/payments/search-pack-service";
import { isProActive, getProStatus } from "@/lib/pro/subscription-service";
import type { UsageResponse } from "@/lib/types";

export const FREE_DAILY_LIMIT = 5;
/** Display value for unlimited tiers — searches are not decremented. */
export const UNLIMITED_DISPLAY_LIMIT = 9999;
/** @deprecated Use UNLIMITED_DISPLAY_LIMIT */
export const ADMIN_DISPLAY_LIMIT = UNLIMITED_DISPLAY_LIMIT;
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

function buildUnlimitedUsage(
  wallet: string,
  tier: "pro" | "admin",
  proExpiresAt?: string | null
): UsageResponse {
  return {
    used: 0,
    limit: UNLIMITED_DISPLAY_LIMIT,
    remaining: UNLIMITED_DISPLAY_LIMIT,
    tier,
    wallet,
    authenticated: true,
    proExpiresAt: proExpiresAt ?? null,
  };
}

async function buildUsage(
  used: number,
  wallet: string | null
): Promise<UsageResponse> {
  if (wallet && isAdminWallet(wallet)) {
    return buildUnlimitedUsage(wallet, "admin");
  }

  if (wallet && (await isProActive(wallet))) {
    const pro = await getProStatus(wallet);
    return buildUnlimitedUsage(wallet, "pro", pro.expiresAt);
  }

  const bonusSearches = wallet ? await getSearchPackBalance(wallet) : 0;

  return {
    used,
    limit: FREE_DAILY_LIMIT,
    remaining: Math.max(0, FREE_DAILY_LIMIT - used),
    bonusSearches,
    tier: "free",
    wallet,
    authenticated: wallet !== null || isWalletAuthDisabled(),
    proExpiresAt: null,
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
  const wallet = getWalletFromRequest(request);
  if (wallet && (isAdminWallet(wallet) || (await isProActive(wallet)))) {
    return getSearchUsage(request);
  }

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
  const wallet = getWalletFromRequest(request);
  if (wallet && (isAdminWallet(wallet) || (await isProActive(wallet)))) {
    return getSearchUsage(request);
  }

  const identifier = getRequestIdentifier(request);
  const date = todayKey();
  const used = await getSearchCount(identifier, date);

  if (used < FREE_DAILY_LIMIT) {
    const nextUsed = await incrementSearchCount(identifier, date);
    return buildUsage(nextUsed, wallet);
  }

  if (wallet) {
    const { consumeSearchPackCredit } = await import(
      "@/lib/payments/search-pack-service"
    );
    const consumed = await consumeSearchPackCredit(wallet);
    if (consumed) {
      return buildUsage(used, wallet);
    }
  }

  return buildUsage(used, wallet);
}

export function canSearch(usage: UsageResponse): boolean {
  if (usage.tier === "admin" || usage.tier === "pro") {
    return usage.authenticated;
  }
  return (
    usage.authenticated &&
    (usage.remaining > 0 || (usage.bonusSearches ?? 0) > 0)
  );
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