import { hasDatabase } from "@/lib/config";
import { prisma } from "@/lib/db";
import {
  memoryHasIpWalletLink,
  memoryRegisterIpWallet,
} from "@/lib/dev/memory-store";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "anonymous"
  );
}

/** Records wallet ↔ IP for analytics. Does not block sign-in. */
export async function registerWalletForIp(
  ip: string,
  wallet: string
): Promise<void> {
  const date = todayKey();

  if (hasDatabase()) {
    await prisma.ipWalletLink.upsert({
      where: { ip_wallet_date: { ip, wallet, date } },
      create: { ip, wallet, date },
      update: {},
    });
    return;
  }

  if (!memoryHasIpWalletLink(ip, wallet, date)) {
    memoryRegisterIpWallet(ip, wallet, date);
  }
}