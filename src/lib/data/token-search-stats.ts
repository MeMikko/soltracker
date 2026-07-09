import { hasDatabase } from "@/lib/config";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import type { RecentToken } from "@/lib/types";

const DEFAULT_LIMIT = 10;

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

function memoryGetRecentTokenSearches(limit: number): RecentToken[] {
  return [...memoryStats.values()]
    .sort((a, b) => b.lastSearchedAt - a.lastSearchedAt)
    .slice(0, limit)
    .map((stat) => toRecentToken(stat));
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

export async function getRecentTokenSearches(
  limit = DEFAULT_LIMIT
): Promise<RecentToken[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  if (!hasDatabase()) {
    return memoryGetRecentTokenSearches(safeLimit);
  }

  const rows = await withDbFallback(
    () =>
      prisma.tokenSearchStat.findMany({
        orderBy: { lastSearchedAt: "desc" },
        take: safeLimit,
      }),
    [],
    "recent token searches"
  );

  return rows.map((row) =>
    toRecentToken({
      mint: row.mintAddress,
      name: row.name,
      symbol: row.symbol,
      imageUrl: row.imageUrl,
      searchCount: row.searchCount,
      lastSearchedAt: row.lastSearchedAt,
    })
  );
}