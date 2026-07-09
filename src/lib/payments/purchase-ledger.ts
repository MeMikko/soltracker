import { hasDatabase } from "@/lib/config";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import type { PurchaseProduct } from "./config";

const usedSignaturesMemory = new Set<string>();

export async function isPurchaseSignatureUsed(
  signature: string
): Promise<boolean> {
  if (usedSignaturesMemory.has(signature)) return true;

  if (!hasDatabase()) return false;

  const [purchase, pro] = await Promise.all([
    withDbFallback(
      () =>
        prisma.purchasePayment.findUnique({
          where: { signature },
          select: { id: true },
        }),
      null,
      `purchase lookup (${signature})`
    ),
    withDbFallback(
      () =>
        prisma.proPayment.findUnique({
          where: { signature },
          select: { id: true },
        }),
      null,
      `pro payment lookup (${signature})`
    ),
  ]);

  return purchase !== null || pro !== null;
}

export async function recordPurchasePayment(input: {
  wallet: string;
  signature: string;
  product: PurchaseProduct | "pro";
  lamports: bigint;
  paidAt: Date;
  metadata?: Record<string, string>;
}): Promise<void> {
  usedSignaturesMemory.add(input.signature);

  if (!hasDatabase()) return;

  await withDbFallback(
    () =>
      prisma.purchasePayment.create({
        data: {
          wallet: input.wallet,
          signature: input.signature,
          product: input.product,
          lamports: input.lamports,
          paidAt: input.paidAt,
          metadata: input.metadata ?? undefined,
        },
      }),
    undefined,
    `purchase record (${input.product})`
  );
}