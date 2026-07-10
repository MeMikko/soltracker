import { hasDatabase } from "@/lib/config";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import {
  memoryAddWalletWarning,
  memoryGetWalletWarning,
  memoryListWalletWarnings,
  memoryRemoveWalletWarning,
} from "@/lib/dev/memory-store";
import type { WalletWarningEntry, WalletWarningInfo } from "@/lib/types";

function toInfo(row: {
  wallet: string;
  note: string | null;
  addedAt: Date;
}): WalletWarningInfo {
  return {
    wallet: row.wallet,
    note: row.note,
    addedAt: row.addedAt.toISOString(),
  };
}

export async function listWalletWarnings(): Promise<WalletWarningEntry[]> {
  if (!hasDatabase()) {
    return memoryListWalletWarnings();
  }

  return withDbFallback(
    async () => {
      const rows = await prisma.walletWarning.findMany({
        orderBy: { addedAt: "desc" },
      });

      return rows.map((row) => ({
        ...toInfo(row),
        addedBy: row.addedBy,
      }));
    },
    [],
    "wallet warning list"
  );
}

export async function getWalletWarning(
  wallet: string
): Promise<WalletWarningInfo | null> {
  if (!hasDatabase()) {
    const row = memoryGetWalletWarning(wallet);
    return row
      ? { wallet: row.wallet, note: row.note, addedAt: row.addedAt }
      : null;
  }

  return withDbFallback(
    async () => {
      const row = await prisma.walletWarning.findUnique({
        where: { wallet },
      });

      return row ? toInfo(row) : null;
    },
    null,
    `wallet warning lookup (${wallet})`
  );
}

export async function addWalletWarning(
  wallet: string,
  addedBy: string,
  note?: string | null
): Promise<WalletWarningEntry> {
  const trimmedNote = note?.trim() || null;

  if (!hasDatabase()) {
    return memoryAddWalletWarning(wallet, addedBy, trimmedNote);
  }

  const row = await withDbFallback(
    () =>
      prisma.walletWarning.upsert({
        where: { wallet },
        create: {
          wallet,
          note: trimmedNote,
          addedBy,
        },
        update: {
          note: trimmedNote,
          addedBy,
          addedAt: new Date(),
        },
      }),
    {
      wallet,
      note: trimmedNote,
      addedBy,
      addedAt: new Date(),
    },
    `wallet warning add (${wallet})`
  );

  return {
    ...toInfo(row),
    addedBy: row.addedBy,
  };
}

export async function removeWalletWarning(wallet: string): Promise<boolean> {
  if (!hasDatabase()) {
    return memoryRemoveWalletWarning(wallet);
  }

  const result = await withDbFallback(
    () =>
      prisma.walletWarning.deleteMany({
        where: { wallet },
      }),
    { count: 0 },
    `wallet warning remove (${wallet})`
  );

  return result.count > 0;
}