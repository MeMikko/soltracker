import type { CacheEnvelope } from "@/lib/cache/types";

interface MemoryCacheEntry {
  value: unknown;
  expiresAt: number;
}

const searchCounts = new Map<string, number>();
const billedSearches = new Map<string, number>();
const ipWalletLinks = new Map<string, Set<string>>();
const cacheEntries = new Map<string, MemoryCacheEntry>();

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