import { isAdminWallet } from "@/lib/auth/admin-wallets";
import { WalletAuthRequiredError } from "@/lib/auth/errors";
import { getWalletFromRequest } from "@/lib/auth/wallet-auth";

export class AdminRequiredError extends Error {
  constructor() {
    super("Admin access required");
    this.name = "AdminRequiredError";
  }
}

export async function assertAdminAccess(request: Request): Promise<string> {
  const wallet = getWalletFromRequest(request);
  if (!wallet) {
    throw new WalletAuthRequiredError();
  }

  if (!isAdminWallet(wallet)) {
    throw new AdminRequiredError();
  }

  return wallet;
}

export function isAdminRequest(request: Request): boolean {
  const wallet = getWalletFromRequest(request);
  return isAdminWallet(wallet);
}