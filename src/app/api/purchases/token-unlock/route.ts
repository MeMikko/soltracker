import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/handle-error";
import { WalletAuthRequiredError } from "@/lib/auth/errors";
import { getWalletFromRequest } from "@/lib/auth/wallet-auth";
import { isPurchaseSignatureUsed } from "@/lib/payments/purchase-ledger";
import { activateTokenUnlockFromPayment } from "@/lib/payments/token-unlock-service";
import { TreasuryPaymentVerificationError } from "@/lib/payments/verify-treasury-payment";
import { getSearchUsage } from "@/lib/rate-limit";
import { parseSolanaAddress } from "@/lib/validation";

const bodySchema = z.object({
  signature: z.string().min(64).max(128),
  mint: z.string().min(32).max(64),
});

export async function POST(request: Request) {
  try {
    const wallet = getWalletFromRequest(request);
    if (!wallet) {
      throw new WalletAuthRequiredError();
    }

    const body = bodySchema.parse(await request.json());
    const mint = parseSolanaAddress(body.mint);

    if (await isPurchaseSignatureUsed(body.signature)) {
      return NextResponse.json(
        { error: "This payment was already used", code: "PAYMENT_USED" },
        { status: 409 }
      );
    }

    const unlock = await activateTokenUnlockFromPayment(
      wallet,
      mint,
      body.signature
    );
    const usage = await getSearchUsage(request);

    return NextResponse.json({
      unlock,
      usage,
    });
  } catch (error) {
    if (error instanceof TreasuryPaymentVerificationError) {
      return NextResponse.json(
        { error: error.message, code: "PAYMENT_INVALID" },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}