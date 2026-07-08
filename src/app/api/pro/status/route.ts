import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-error";
import { getWalletFromRequest } from "@/lib/auth/wallet-auth";
import { getProStatus } from "@/lib/pro/subscription-service";
import {
  PRO_PERIOD_DAYS,
  PRO_PRICE_SOL,
  PRO_TREASURY_WALLET,
} from "@/lib/pro/config";

export async function GET(request: Request) {
  try {
    const wallet = getWalletFromRequest(request);
    const pro = wallet ? await getProStatus(wallet) : { active: false, expiresAt: null };

    return NextResponse.json({
      pro,
      pricing: {
        sol: PRO_PRICE_SOL,
        periodDays: PRO_PERIOD_DAYS,
        treasury: PRO_TREASURY_WALLET,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}