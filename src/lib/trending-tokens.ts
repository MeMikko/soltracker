import { getCachedOrFetch } from "@/lib/cache";
import { getTokenSearches } from "@/lib/data/token-search-stats";

const DEXSCREENER_BOOSTS_URL =
  "https://api.dexscreener.com/token-boosts/top/v1";
const DEXSCREENER_PROFILES_URL =
  "https://api.dexscreener.com/token-profiles/latest/v1";

const TRENDING_CACHE_KEY = "trending:solana:v1";
const TRENDING_CACHE_TTL_SECONDS = 3 * 60;
const COMMUNITY_POOL_LIMIT = 50;

export type TrendingTokenSource = "dexscreener" | "community";

export interface TrendingToken {
  mint: string;
  name: string | null;
  symbol: string | null;
  imageUrl: string | null;
  source: TrendingTokenSource;
}

interface DexScreenerEntry {
  chainId?: string;
  tokenAddress?: string;
  description?: string;
  icon?: string;
}

function dexIconUrl(icon: string | undefined): string | null {
  if (!icon) return null;
  if (icon.startsWith("http")) return icon;
  return `https://cdn.dexscreener.com/cms/images/${icon}?width=64&height=64&fit=crop&quality=95&format=auto`;
}

function parseDexEntries(entries: DexScreenerEntry[]): TrendingToken[] {
  const seen = new Set<string>();
  const tokens: TrendingToken[] = [];

  for (const entry of entries) {
    if (entry.chainId !== "solana" || !entry.tokenAddress) continue;
    const mint = entry.tokenAddress.trim();
    if (!mint || seen.has(mint)) continue;
    seen.add(mint);

    tokens.push({
      mint,
      name: null,
      symbol: null,
      imageUrl: dexIconUrl(entry.icon),
      source: "dexscreener",
    });
  }

  return tokens;
}

async function fetchDexScreenerTrending(): Promise<TrendingToken[]> {
  const [boostsRes, profilesRes] = await Promise.all([
    fetch(DEXSCREENER_BOOSTS_URL, { next: { revalidate: 180 } }),
    fetch(DEXSCREENER_PROFILES_URL, { next: { revalidate: 180 } }),
  ]);

  const boosts: DexScreenerEntry[] = boostsRes.ok
    ? ((await boostsRes.json()) as DexScreenerEntry[])
    : [];
  const profiles: DexScreenerEntry[] = profilesRes.ok
    ? ((await profilesRes.json()) as DexScreenerEntry[])
    : [];

  return [...parseDexEntries(boosts), ...parseDexEntries(profiles)];
}

async function fetchCommunityTrending(): Promise<TrendingToken[]> {
  const { tokens } = await getTokenSearches(COMMUNITY_POOL_LIMIT, "popular");
  return tokens.map((token) => ({
    mint: token.mint,
    name: token.name,
    symbol: token.symbol,
    imageUrl: token.imageUrl,
    source: "community" as const,
  }));
}

export async function getTrendingTokenPool(): Promise<TrendingToken[]> {
  const { data: dexTokens } = await getCachedOrFetch(
    TRENDING_CACHE_KEY,
    fetchDexScreenerTrending,
    { ttlSeconds: TRENDING_CACHE_TTL_SECONDS }
  );

  if (dexTokens.length > 0) {
    return dexTokens;
  }

  return fetchCommunityTrending();
}

export async function pickRandomTrendingToken(): Promise<TrendingToken | null> {
  const pool = await getTrendingTokenPool();
  if (pool.length === 0) return null;

  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? null;
}