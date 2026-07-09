import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/handle-error";
import { WalletAuthRequiredError } from "@/lib/auth/errors";
import { getWalletFromRequest } from "@/lib/auth/wallet-auth";
import { isPurchaseSignatureUsed } from "@/lib/payments/purchase-ledger";
import { activateSearchPackFromPayment } from "@/lib/payments/search-pack-service";
import { TreasuryPaymentVerificationError } from "@/lib/payments/verify-treasury-payment";
import { getSearchUsage } from "@/lib/rate-limit";

const bodySchema = z.object({
  signature: z.string().min(64).max(128),
});

export async function POST(request: Request) {
  try {
    const wallet = getWalletFromRequest(request);
    if (!wallet) {
      throw new WalletAuthRequiredError();
    }

    const body = bodySchema.parse(await request.json());

    if (await isPurchaseSignatureUsed(body.signature)) {
      return NextResponse.json(
        { error: "This payment was already used", code: "PAYMENT_USED" },
        { status: 409 }
      );
    }

    const purchase = await activateSearchPackFromPayment(wallet, body.signature);
    const usage = await getSearchUsage(request);

    return NextResponse.json({
      purchase,
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