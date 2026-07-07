import { NextResponse } from "next/server";
import {
  getWalletFromRequest,
  isWalletAuthDisabled,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/wallet-auth";

export async function GET(request: Request) {
  if (isWalletAuthDisabled()) {
    return NextResponse.json({ wallet: null, disabled: true });
  }

  const wallet = getWalletFromRequest(request);
  return NextResponse.json({ wallet, authenticated: Boolean(wallet) });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}