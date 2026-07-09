import { hasDatabase } from "@/lib/config";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import type { RecentToken } from "@/lib/types";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 500;

export type TokenSearchSort = "popular" | "recent";

interface TokenSearchInput {
  mint: string;
  name: string | null;
  symbol: string | null;
  imageUrl: string | null;
}

interface MemoryTokenSearchStat extends TokenSearchInput {
  searchCount: number;
  lastSearchedAt: number;
}

const memoryStats = new Map<string, MemoryTokenSearchStat>();

function toRecentToken(stat: {
  mint: string;
  name: string | null;
  symbol: string | null;
  imageUrl: string | null;
  searchCount: number;
  lastSearchedAt: Date | number;
}): RecentToken {
  return {
    mint: stat.mint,
    name: stat.name,
    symbol: stat.symbol,
    imageUrl: stat.imageUrl,
    searchCount: stat.searchCount,
    lastSearchedAt:
      stat.lastSearchedAt instanceof Date
        ? stat.lastSearchedAt.toISOString()
        : new Date(stat.lastSearchedAt).toISOString(),
  };
}

function memoryRecordTokenSearch(input: TokenSearchInput): void {
  const existing = memoryStats.get(input.mint);
  const now = Date.now();

  memoryStats.set(input.mint, {
    mint: input.mint,
    name: input.name ?? existing?.name ?? null,
    symbol: input.symbol ?? existing?.symbol ?? null,
    imageUrl: input.imageUrl ?? existing?.imageUrl ?? null,
    searchCount: (existing?.searchCount ?? 0) + 1,
    lastSearchedAt: now,
  });
}

function memorySortStats(
  stats: MemoryTokenSearchStat[],
  sort: TokenSearchSort
): MemoryTokenSearchStat[] {
  return [...stats].sort((a, b) => {
    if (sort === "popular") {
      if (b.searchCount !== a.searchCount) {
        return b.searchCount - a.searchCount;
      }
    }
    return b.lastSearchedAt - a.lastSearchedAt;
  });
}

function memoryGetTokenSearches(
  limit: number,
  sort: TokenSearchSort
): { tokens: RecentToken[]; total: number } {
  const sorted = memorySortStats([...memoryStats.values()], sort);
  return {
    tokens: sorted.slice(0, limit).map((stat) => toRecentToken(stat)),
    total: sorted.length,
  };
}

export async function recordTokenSearch(input: TokenSearchInput): Promise<void> {
  if (!hasDatabase()) {
    memoryRecordTokenSearch(input);
    return;
  }

  await withDbFallback(
    () =>
      prisma.tokenSearchStat.upsert({
        where: { mintAddress: input.mint },
        create: {
          mintAddress: input.mint,
          name: input.name,
          symbol: input.symbol,
          imageUrl: input.imageUrl,
          searchCount: 1,
          lastSearchedAt: new Date(),
        },
        update: {
          name: input.name ?? undefined,
          symbol: input.symbol ?? undefined,
          imageUrl: input.imageUrl ?? undefined,
          searchCount: { increment: 1 },
          lastSearchedAt: new Date(),
        },
      }),
    undefined,
    `token search stat (${input.mint})`
  );
}

function orderByForSort(sort: TokenSearchSort) {
  return sort === "popular"
    ? [{ searchCount: "desc" as const }, { lastSearchedAt: "desc" as const }]
    : [{ lastSearchedAt: "desc" as const }];
}

export async function getTokenSearches(
  limit = DEFAULT_LIMIT,
  sort: TokenSearchSort = "popular"
): Promise<{ tokens: RecentToken[]; total: number }> {
  const safeLimit = Math.min(Math.max(limit, 1), MAX_LIMIT);

  if (!hasDatabase()) {
    return memoryGetTokenSearches(safeLimit, sort);
  }

  const [rows, total] = await Promise.all([
    withDbFallback(
      () =>
        prisma.tokenSearchStat.findMany({
          orderBy: orderByForSort(sort),
          take: safeLimit,
        }),
      [],
      "token searches"
    ),
    withDbFallback(
      () => prisma.tokenSearchStat.count(),
      0,
      "token search count"
    ),
  ]);

  return {
    tokens: rows.map((row) =>
      toRecentToken({
        mint: row.mintAddress,
        name: row.name,
        symbol: row.symbol,
        imageUrl: row.imageUrl,
        searchCount: row.searchCount,
        lastSearchedAt: row.lastSearchedAt,
      })
    ),
    total,
  };
}

/** @deprecated Use getTokenSearches */
export async function getRecentTokenSearches(
  limit = DEFAULT_LIMIT
): Promise<RecentToken[]> {
  const result = await getTokenSearches(limit, "recent");
  return result.tokens;
}