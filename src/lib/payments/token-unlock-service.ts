import { hasDatabase } from "@/lib/config";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import {
  memoryGetTokenUnlockExpiry,
  memorySetTokenUnlock,
} from "@/lib/dev/memory-store";
import {
  TOKEN_UNLOCK_DAYS,
  TOKEN_UNLOCK_PRICE_LAMPORTS,
} from "./config";
import { recordPurchasePayment } from "./purchase-ledger";
import { verifyTreasuryPayment } from "./verify-treasury-payment";

export interface TokenUnlockStatus {
  unlocked: boolean;
  expiresAt: string | null;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export async function getTokenUnlockStatus(
  wallet: string,
  mintAddress: string
): Promise<TokenUnlockStatus> {
  const now = new Date();

  if (!hasDatabase()) {
    const expiresAtMs = memoryGetTokenUnlockExpiry(wallet, mintAddress);
    if (!expiresAtMs || expiresAtMs <= now.getTime()) {
      return { unlocked: false, expiresAt: null };
    }
    return {
      unlocked: true,
      expiresAt: new Date(expiresAtMs).toISOString(),
    };
  }

  const row = await withDbFallback(
    () =>
      prisma.tokenUnlock.findUnique({
        where: {
          wallet_mintAddress: { wallet, mintAddress },
        },
        select: { unlockedUntil: true },
      }),
    null,
    `token unlock status (${wallet})`
  );

  if (!row || row.unlockedUntil <= now) {
    return { unlocked: false, expiresAt: null };
  }

  return {
    unlocked: true,
    expiresAt: row.unlockedUntil.toISOString(),
  };
}

export async function hasTokenUnlock(
  wallet: string,
  mintAddress: string
): Promise<boolean> {
  const status = await getTokenUnlockStatus(wallet, mintAddress);
  return status.unlocked;
}

export async function activateTokenUnlockFromPayment(
  wallet: string,
  mintAddress: string,
  signature: string
): Promise<TokenUnlockStatus> {
  const payment = await verifyTreasuryPayment(
    signature,
    wallet,
    TOKEN_UNLOCK_PRICE_LAMPORTS
  );

  const now = new Date();
  const existing = await getTokenUnlockStatus(wallet, mintAddress);
  const base =
    existing.unlocked && existing.expiresAt
      ? new Date(existing.expiresAt)
      : now;
  const periodStart = base > now ? base : now;
  const unlockedUntil = addDays(periodStart, TOKEN_UNLOCK_DAYS);

  if (!hasDatabase()) {
    memorySetTokenUnlock(wallet, mintAddress, unlockedUntil.getTime());
  } else {
    await withDbFallback(
      () =>
        prisma.tokenUnlock.upsert({
          where: {
            wallet_mintAddress: { wallet, mintAddress },
          },
          create: {
            wallet,
            mintAddress,
            unlockedUntil,
          },
          update: {
            unlockedUntil,
          },
        }),
      undefined,
      `token unlock (${wallet})`
    );
  }

  await recordPurchasePayment({
    wallet,
    signature,
    product: "token_unlock",
    lamports: BigInt(payment.lamports),
    paidAt: payment.paidAt,
    metadata: { mint: mintAddress },
  });

  return {
    unlocked: true,
    expiresAt: unlockedUntil.toISOString(),
  };
}