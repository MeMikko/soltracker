import { NextResponse } from "next/server";
import { WalletAuthRequiredError } from "@/lib/auth/errors";
import { getWalletFromRequest } from "@/lib/auth/wallet-auth";
import { handleApiError } from "@/lib/api/handle-error";
import { getTokenUnlockStatus } from "@/lib/payments/token-unlock-service";
import { isProActive } from "@/lib/pro/subscription-service";
import { isAdminWallet } from "@/lib/auth/admin-wallets";
import { parseSolanaAddress } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const wallet = getWalletFromRequest(request);
    if (!wallet) {
      throw new WalletAuthRequiredError();
    }

    const { searchParams } = new URL(request.url);
    const mint = parseSolanaAddress(searchParams.get("mint") ?? "");

    if (isAdminWallet(wallet) || (await isProActive(wallet))) {
      return NextResponse.json({
        unlocked: true,
        expiresAt: null,
        via: "pro",
      });
    }

    const status = await getTokenUnlockStatus(wallet, mint);

    return NextResponse.json({
      ...status,
      via: status.unlocked ? "token_unlock" : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}