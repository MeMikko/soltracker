import { hasDatabase } from "@/lib/config";
import { prisma } from "@/lib/db";
import {
  memoryGetIpWalletCount,
  memoryHasIpWalletLink,
  memoryRegisterIpWallet,
} from "@/lib/dev/memory-store";

export const MAX_WALLETS_PER_IP_PER_DAY = 2;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export class IpWalletLimitError extends Error {
  constructor() {
    super(
      `This network already used ${MAX_WALLETS_PER_IP_PER_DAY} wallets today. Connect one of them or upgrade to Pro.`
    );
    this.name = "IpWalletLimitError";
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "anonymous"
  );
}

export async function assertWalletAllowedForIp(
  ip: string,
  wallet: string
): Promise<void> {
  const date = todayKey();

  if (hasDatabase()) {
    const existing = await prisma.ipWalletLink.findUnique({
      where: { ip_wallet_date: { ip, wallet, date } },
    });
    if (existing) return;

    const count = await prisma.ipWalletLink.count({
      where: { ip, date },
    });

    if (count >= MAX_WALLETS_PER_IP_PER_DAY) {
      throw new IpWalletLimitError();
    }

    await prisma.ipWalletLink.create({
      data: { ip, wallet, date },
    });
    return;
  }

  if (memoryHasIpWalletLink(ip, wallet, date)) return;

  if (memoryGetIpWalletCount(ip, date) >= MAX_WALLETS_PER_IP_PER_DAY) {
    throw new IpWalletLimitError();
  }

  memoryRegisterIpWallet(ip, wallet, date);
}