import { hasDatabase } from "@/lib/config";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import type { AdminAnalytics } from "@/lib/types";

const LAMPORTS_PER_SOL = 1_000_000_000;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function lastNDays(count: number): string[] {
  const days: string[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - offset);
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

function lamportsToSol(lamports: bigint | number): number {
  return Number(lamports) / LAMPORTS_PER_SOL;
}

const EMPTY_ANALYTICS: AdminAnalytics = {
  generatedAt: new Date().toISOString(),
  databaseAvailable: false,
  overview: {
    searchesToday: 0,
    searchesLast7Days: 0,
    uniqueSearchersToday: 0,
    uniqueSearchersLast7Days: 0,
    activeProSubscriptions: 0,
    activeTokenUnlocks: 0,
    bonusSearchesOutstanding: 0,
    trackedTokens: 0,
    cachedTokens: 0,
    cachedWallets: 0,
  },
  revenue: {
    proPaymentsCount: 0,
    proRevenueSol: 0,
    searchPackPurchases: 0,
    searchPackRevenueSol: 0,
    tokenUnlockPurchases: 0,
    tokenUnlockRevenueSol: 0,
    totalRevenueSol: 0,
  },
  dailySearches: [],
  topTokens: [],
  recentProPayments: [],
  recentPurchases: [],
};

async function fetchAnalyticsFromDb(): Promise<AdminAnalytics> {
  const now = new Date();
  const today = todayKey();
  const days = lastNDays(7);
  const weekStart = days[0];

  const [
    searchLogsToday,
    searchLogsWeek,
    activePro,
    activeUnlocks,
    bonusRemaining,
    trackedTokens,
    cachedTokens,
    cachedWallets,
    proPaymentsAgg,
    purchaseGroups,
    topTokens,
    recentProPayments,
    recentPurchases,
  ] = await Promise.all([
    prisma.searchLog.findMany({ where: { date: today } }),
    prisma.searchLog.findMany({
      where: { date: { gte: weekStart } },
    }),
    prisma.proSubscription.count({
      where: { activeUntil: { gt: now } },
    }),
    prisma.tokenUnlock.count({
      where: { unlockedUntil: { gt: now } },
    }),
    prisma.searchPackBalance.aggregate({ _sum: { remaining: true } }),
    prisma.tokenSearchStat.count(),
    prisma.token.count(),
    prisma.wallet.count(),
    prisma.proPayment.aggregate({ _count: true, _sum: { lamports: true } }),
    prisma.purchasePayment.groupBy({
      by: ["product"],
      _count: true,
      _sum: { lamports: true },
    }),
    prisma.tokenSearchStat.findMany({
      orderBy: [{ searchCount: "desc" }, { lastSearchedAt: "desc" }],
      take: 10,
    }),
    prisma.proPayment.findMany({
      orderBy: { paidAt: "desc" },
      take: 8,
      select: {
        wallet: true,
        lamports: true,
        paidAt: true,
        periodEnd: true,
      },
    }),
    prisma.purchasePayment.findMany({
      orderBy: { paidAt: "desc" },
      take: 10,
      select: {
        wallet: true,
        product: true,
        lamports: true,
        paidAt: true,
        metadata: true,
      },
    }),
  ]);

  const searchesToday = searchLogsToday.reduce((sum, row) => sum + row.count, 0);
  const searchesLast7Days = searchLogsWeek.reduce((sum, row) => sum + row.count, 0);
  const uniqueSearchersToday = new Set(searchLogsToday.map((row) => row.identifier)).size;
  const uniqueSearchersLast7Days = new Set(
    searchLogsWeek.map((row) => row.identifier)
  ).size;

  const dailyMap = new Map(days.map((date) => [date, { date, searches: 0, searchers: 0 }]));
  for (const row of searchLogsWeek) {
    const bucket = dailyMap.get(row.date);
    if (!bucket) continue;
    bucket.searches += row.count;
    bucket.searchers += 1;
  }

  const purchaseStats = {
    search_pack: { count: 0, sol: 0 },
    token_unlock: { count: 0, sol: 0 },
  };

  for (const group of purchaseGroups) {
    if (group.product === "search_pack") {
      purchaseStats.search_pack.count = group._count;
      purchaseStats.search_pack.sol = lamportsToSol(
        group._sum.lamports ?? BigInt(0)
      );
    }
    if (group.product === "token_unlock") {
      purchaseStats.token_unlock.count = group._count;
      purchaseStats.token_unlock.sol = lamportsToSol(
        group._sum.lamports ?? BigInt(0)
      );
    }
  }

  const proRevenueSol = lamportsToSol(proPaymentsAgg._sum.lamports ?? BigInt(0));

  return {
    generatedAt: now.toISOString(),
    databaseAvailable: true,
    overview: {
      searchesToday,
      searchesLast7Days,
      uniqueSearchersToday,
      uniqueSearchersLast7Days,
      activeProSubscriptions: activePro,
      activeTokenUnlocks: activeUnlocks,
      bonusSearchesOutstanding: bonusRemaining._sum.remaining ?? 0,
      trackedTokens,
      cachedTokens,
      cachedWallets,
    },
    revenue: {
      proPaymentsCount: proPaymentsAgg._count,
      proRevenueSol,
      searchPackPurchases: purchaseStats.search_pack.count,
      searchPackRevenueSol: purchaseStats.search_pack.sol,
      tokenUnlockPurchases: purchaseStats.token_unlock.count,
      tokenUnlockRevenueSol: purchaseStats.token_unlock.sol,
      totalRevenueSol:
        proRevenueSol +
        purchaseStats.search_pack.sol +
        purchaseStats.token_unlock.sol,
    },
    dailySearches: days.map((date) => dailyMap.get(date)!),
    topTokens: topTokens.map((token) => ({
      mint: token.mintAddress,
      name: token.name,
      symbol: token.symbol,
      searchCount: token.searchCount,
      lastSearchedAt: token.lastSearchedAt.toISOString(),
    })),
    recentProPayments: recentProPayments.map((payment) => ({
      wallet: payment.wallet,
      sol: lamportsToSol(payment.lamports),
      paidAt: payment.paidAt.toISOString(),
      periodEnd: payment.periodEnd.toISOString(),
    })),
    recentPurchases: recentPurchases.map((payment) => ({
      wallet: payment.wallet,
      product: payment.product,
      sol: lamportsToSol(payment.lamports),
      paidAt: payment.paidAt.toISOString(),
      metadata:
        payment.metadata && typeof payment.metadata === "object"
          ? (payment.metadata as Record<string, string>)
          : null,
    })),
  };
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  if (!hasDatabase()) {
    return { ...EMPTY_ANALYTICS, generatedAt: new Date().toISOString() };
  }

  return withDbFallback(
    () => fetchAnalyticsFromDb(),
    { ...EMPTY_ANALYTICS, generatedAt: new Date().toISOString() },
    "admin analytics"
  );
}