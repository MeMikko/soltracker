import type { CacheEnvelope } from "@/lib/cache/types";
import { FEATURED_TOKEN_MINT } from "@/lib/featured-token";
import type { FeaturedTokenAdminSetting } from "@/lib/types";

interface MemoryCacheEntry {
  value: unknown;
  expiresAt: number;
}

const searchCounts = new Map<string, number>();
const billedSearches = new Map<string, number>();
const ipWalletLinks = new Map<string, Set<string>>();
const cacheEntries = new Map<string, MemoryCacheEntry>();
const proExpiryByWallet = new Map<string, number>();
const searchPackBalanceByWallet = new Map<string, number>();
const tokenUnlockExpiryByKey = new Map<string, number>();
let featuredTokenSetting: FeaturedTokenAdminSetting = {
  enabled: true,
  mint: FEATURED_TOKEN_MINT,
  updatedAt: new Date(0).toISOString(),
  updatedBy: null,
};

function tokenUnlockKey(wallet: string, mintAddress: string): string {
  return `${wallet}:${mintAddress}`;
}

function ipWalletKey(ip: string, date: string): string {
  return `${ip}:${date}`;
}

function searchKey(identifier: string, date: string): string {
  return `${identifier}:${date}`;
}

export function memoryGetSearchCount(
  identifier: string,
  date: string
): number {
  return searchCounts.get(searchKey(identifier, date)) ?? 0;
}

export function memoryIncrementSearchCount(
  identifier: string,
  date: string
): number {
  const key = searchKey(identifier, date);
  const next = (searchCounts.get(key) ?? 0) + 1;
  searchCounts.set(key, next);
  return next;
}

export function memoryTryClaimBilledSearch(
  key: string,
  ttlSeconds: number
): boolean {
  const now = Date.now();
  const expiresAt = billedSearches.get(key);

  if (expiresAt && expiresAt > now) {
    return false;
  }

  billedSearches.set(key, now + ttlSeconds * 1000);
  return true;
}

export function memoryHasIpWalletLink(
  ip: string,
  wallet: string,
  date: string
): boolean {
  return ipWalletLinks.get(ipWalletKey(ip, date))?.has(wallet) ?? false;
}

export function memoryGetIpWalletCount(ip: string, date: string): number {
  return ipWalletLinks.get(ipWalletKey(ip, date))?.size ?? 0;
}

export function memoryRegisterIpWallet(
  ip: string,
  wallet: string,
  date: string
): void {
  const key = ipWalletKey(ip, date);
  const wallets = ipWalletLinks.get(key) ?? new Set<string>();
  wallets.add(wallet);
  ipWalletLinks.set(key, wallets);
}

export function memoryCacheGet<T>(key: string): CacheEnvelope<T> | null {
  const entry = cacheEntries.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) cacheEntries.delete(key);
    return null;
  }

  return {
    data: entry.value as T,
    cachedAt: new Date(entry.expiresAt).toISOString(),
  };
}

export function memoryGetProExpiry(wallet: string): number | null {
  return proExpiryByWallet.get(wallet) ?? null;
}

export function memorySetProExpiry(wallet: string, expiresAtMs: number): void {
  proExpiryByWallet.set(wallet, expiresAtMs);
}

export function memoryGetSearchPackBalance(wallet: string): number {
  return searchPackBalanceByWallet.get(wallet) ?? 0;
}

export function memoryAddSearchPackCredits(
  wallet: string,
  count: number
): number {
  const next = (searchPackBalanceByWallet.get(wallet) ?? 0) + count;
  searchPackBalanceByWallet.set(wallet, next);
  return next;
}

export function memoryConsumeSearchPackCredit(wallet: string): boolean {
  const current = searchPackBalanceByWallet.get(wallet) ?? 0;
  if (current <= 0) return false;
  searchPackBalanceByWallet.set(wallet, current - 1);
  return true;
}

export function memoryGetTokenUnlockExpiry(
  wallet: string,
  mintAddress: string
): number | null {
  return tokenUnlockExpiryByKey.get(tokenUnlockKey(wallet, mintAddress)) ?? null;
}

export function memorySetTokenUnlock(
  wallet: string,
  mintAddress: string,
  expiresAtMs: number
): void {
  tokenUnlockExpiryByKey.set(
    tokenUnlockKey(wallet, mintAddress),
    expiresAtMs
  );
}

export function memoryGetFeaturedTokenSetting(): FeaturedTokenAdminSetting {
  return featuredTokenSetting;
}

export function memorySetFeaturedTokenSetting(
  setting: FeaturedTokenAdminSetting
): void {
  featuredTokenSetting = setting;
}

export function memoryCacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number
): void {
  cacheEntries.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}