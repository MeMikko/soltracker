import { hasDatabase } from "@/lib/config";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import {
  memoryAddSearchPackCredits,
  memoryConsumeSearchPackCredit,
  memoryGetSearchPackBalance,
} from "@/lib/dev/memory-store";
import {
  EXTRA_SEARCH_PACK_COUNT,
  EXTRA_SEARCH_PACK_PRICE_LAMPORTS,
} from "./config";
import { recordPurchasePayment } from "./purchase-ledger";
import { verifyTreasuryPayment } from "./verify-treasury-payment";

export async function getSearchPackBalance(wallet: string): Promise<number> {
  if (!hasDatabase()) {
    return memoryGetSearchPackBalance(wallet);
  }

  const row = await withDbFallback(
    () =>
      prisma.searchPackBalance.findUnique({
        where: { wallet },
        select: { remaining: true },
      }),
    null,
    `search pack balance (${wallet})`
  );

  return row?.remaining ?? 0;
}

export async function addSearchPackCredits(
  wallet: string,
  count: number
): Promise<number> {
  if (!hasDatabase()) {
    return memoryAddSearchPackCredits(wallet, count);
  }

  const row = await withDbFallback(
    () =>
      prisma.searchPackBalance.upsert({
        where: { wallet },
        create: { wallet, remaining: count },
        update: { remaining: { increment: count } },
      }),
    { wallet, remaining: count, updatedAt: new Date() },
    `search pack credit (${wallet})`
  );

  return row.remaining;
}

export async function consumeSearchPackCredit(
  wallet: string
): Promise<boolean> {
  if (!hasDatabase()) {
    return memoryConsumeSearchPackCredit(wallet);
  }

  const row = await withDbFallback(
    () => prisma.searchPackBalance.findUnique({ where: { wallet } }),
    null,
    `search pack consume read (${wallet})`
  );

  if (!row || row.remaining <= 0) return false;

  await withDbFallback(
    () =>
      prisma.searchPackBalance.update({
        where: { wallet },
        data: { remaining: { decrement: 1 } },
      }),
    undefined,
    `search pack consume (${wallet})`
  );

  return true;
}

export async function activateSearchPackFromPayment(
  wallet: string,
  signature: string
): Promise<{ bonusSearches: number }> {
  const payment = await verifyTreasuryPayment(
    signature,
    wallet,
    EXTRA_SEARCH_PACK_PRICE_LAMPORTS
  );

  await recordPurchasePayment({
    wallet,
    signature,
    product: "search_pack",
    lamports: BigInt(payment.lamports),
    paidAt: payment.paidAt,
    metadata: { count: String(EXTRA_SEARCH_PACK_COUNT) },
  });

  const bonusSearches = await addSearchPackCredits(
    wallet,
    EXTRA_SEARCH_PACK_COUNT
  );

  return { bonusSearches };
}