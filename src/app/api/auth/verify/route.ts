import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/handle-error";
import { assertWalletAllowedForIp, getClientIp } from "@/lib/auth/ip-wallet-limit";
import {
  createSessionToken,
  isWalletAuthDisabled,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyChallenge,
  verifyWalletSignature,
} from "@/lib/auth/wallet-auth";
import { parseSolanaAddress } from "@/lib/validation";

const verifySchema = z.object({
  wallet: z.string().min(32).max(64),
  message: z.string().min(1),
  signature: z.string().min(1),
  challenge: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    if (isWalletAuthDisabled()) {
      return NextResponse.json({ ok: true, disabled: true });
    }

    const body = verifySchema.parse(await request.json());
    const wallet = parseSolanaAddress(body.wallet);

    if (!verifyChallenge(wallet, body.challenge)) {
      return NextResponse.json(
        { error: "Sign-in challenge expired. Try again.", code: "AUTH_EXPIRED" },
        { status: 400 }
      );
    }

    if (!verifyWalletSignature(wallet, body.message, body.signature)) {
      return NextResponse.json(
        { error: "Invalid wallet signature", code: "AUTH_INVALID" },
        { status: 401 }
      );
    }

    await assertWalletAllowedForIp(getClientIp(request), wallet);

    const token = createSessionToken(wallet);
    const response = NextResponse.json({ ok: true, wallet });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}