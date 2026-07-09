import { isAdminWallet } from "@/lib/auth/admin-wallets";
import { WalletAuthRequiredError } from "@/lib/auth/errors";
import { getWalletFromRequest } from "@/lib/auth/wallet-auth";
import { hasTokenUnlock } from "@/lib/payments/token-unlock-service";
import { isProActive } from "@/lib/pro/subscription-service";

export class ProRequiredError extends Error {
  constructor() {
    super("Pro subscription required");
    this.name = "ProRequiredError";
  }
}

export async function assertProAccess(request: Request): Promise<void> {
  const wallet = getWalletFromRequest(request);
  if (!wallet) {
    throw new WalletAuthRequiredError();
  }

  if (isAdminWallet(wallet) || (await isProActive(wallet))) {
    return;
  }

  throw new ProRequiredError();
}

export async function assertProOrTokenUnlock(
  request: Request,
  mintAddress: string
): Promise<void> {
  const wallet = getWalletFromRequest(request);
  if (!wallet) {
    throw new WalletAuthRequiredError();
  }

  if (isAdminWallet(wallet) || (await isProActive(wallet))) {
    return;
  }

  if (await hasTokenUnlock(wallet, mintAddress)) {
    return;
  }

  throw new ProRequiredError();
}