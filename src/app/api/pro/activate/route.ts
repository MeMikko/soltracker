import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/handle-error";
import { WalletAuthRequiredError } from "@/lib/auth/errors";
import { getWalletFromRequest } from "@/lib/auth/wallet-auth";
import { getSearchUsage } from "@/lib/rate-limit";
import {
  activateProFromPayment,
  isPaymentSignatureUsed,
} from "@/lib/pro/subscription-service";
import {
  ProPaymentVerificationError,
  verifyProPaymentSignature,
} from "@/lib/pro/verify-payment";

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

    if (await isPaymentSignatureUsed(body.signature)) {
      return NextResponse.json(
        { error: "This payment was already used", code: "PAYMENT_USED" },
        { status: 409 }
      );
    }

    const payment = await verifyProPaymentSignature(body.signature, wallet);
    const pro = await activateProFromPayment(
      wallet,
      body.signature,
      BigInt(payment.lamports),
      payment.paidAt
    );

    const usage = await getSearchUsage(request);

    return NextResponse.json({
      pro,
      usage,
    });
  } catch (error) {
    if (error instanceof ProPaymentVerificationError) {
      return NextResponse.json(
        { error: error.message, code: "PAYMENT_INVALID" },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
}