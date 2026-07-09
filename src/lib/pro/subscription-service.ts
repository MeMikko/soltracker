import { hasDatabase } from "@/lib/config";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import {
  memoryGetProExpiry,
  memorySetProExpiry,
} from "@/lib/dev/memory-store";
import { PRO_PERIOD_DAYS } from "./config";

export interface ProStatus {
  active: boolean;
  expiresAt: string | null;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export async function getProStatus(wallet: string): Promise<ProStatus> {
  const now = new Date();

  if (!hasDatabase()) {
    const expiresAtMs = memoryGetProExpiry(wallet);
    if (!expiresAtMs || expiresAtMs <= now.getTime()) {
      return { active: false, expiresAt: null };
    }
    return {
      active: true,
      expiresAt: new Date(expiresAtMs).toISOString(),
    };
  }

  const row = await withDbFallback(
    async () =>
      prisma.proSubscription.findUnique({
        where: { wallet },
        select: { activeUntil: true },
      }),
    null,
    `pro status (${wallet})`
  );

  if (!row || row.activeUntil <= now) {
    return { active: false, expiresAt: null };
  }

  return {
    active: true,
    expiresAt: row.activeUntil.toISOString(),
  };
}

export async function isProActive(wallet: string): Promise<boolean> {
  const status = await getProStatus(wallet);
  return status.active;
}

export async function activateProFromPayment(
  wallet: string,
  signature: string,
  lamports: bigint,
  paidAt: Date
): Promise<ProStatus> {
  const now = new Date();
  const existing = await getProStatus(wallet);
  const base =
    existing.active && existing.expiresAt
      ? new Date(existing.expiresAt)
      : now;
  const periodStart = base > now ? base : now;
  const periodEnd = addDays(periodStart, PRO_PERIOD_DAYS);

  if (!hasDatabase()) {
    memorySetProExpiry(wallet, periodEnd.getTime());
    return { active: true, expiresAt: periodEnd.toISOString() };
  }

  await withDbFallback(
    async () => {
      await prisma.$transaction([
        prisma.proPayment.create({
          data: {
            wallet,
            signature,
            lamports,
            paidAt,
            periodEnd,
          },
        }),
        prisma.proSubscription.upsert({
          where: { wallet },
          create: {
            wallet,
            activeUntil: periodEnd,
          },
          update: {
            activeUntil: periodEnd,
          },
        }),
      ]);
    },
    undefined,
    `pro activate (${wallet})`
  );

  memorySetProExpiry(wallet, periodEnd.getTime());

  return { active: true, expiresAt: periodEnd.toISOString() };
}

export async function isPaymentSignatureUsed(
  signature: string
): Promise<boolean> {
  const { isPurchaseSignatureUsed } = await import(
    "@/lib/payments/purchase-ledger"
  );
  return isPurchaseSignatureUsed(signature);
}