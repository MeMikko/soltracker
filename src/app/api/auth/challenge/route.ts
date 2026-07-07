import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-error";
import {
  buildSignInMessage,
  createChallenge,
  isWalletAuthDisabled,
} from "@/lib/auth/wallet-auth";
import { parseSolanaAddress } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    if (isWalletAuthDisabled()) {
      return NextResponse.json({ disabled: true });
    }

    const { searchParams } = new URL(request.url);
    const wallet = parseSolanaAddress(searchParams.get("wallet") ?? "");
    const challenge = createChallenge(wallet);
    const message = buildSignInMessage(wallet, challenge);

    return NextResponse.json({ wallet, challenge, message });
  } catch (error) {
    return handleApiError(error);
  }
}