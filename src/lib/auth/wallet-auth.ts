import { createHmac, timingSafeEqual } from "node:crypto";
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { safeParseSolanaAddress } from "@/lib/validation";

export const SESSION_COOKIE = "si_wallet_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export function getAuthSecret(): string {
  return (
    process.env.WALLET_AUTH_SECRET?.trim() ||
    process.env.HELIUS_API_KEY?.trim() ||
    "dev-wallet-auth-secret"
  );
}

export function isWalletAuthDisabled(): boolean {
  return process.env.WALLET_AUTH_DISABLED === "true";
}

export function buildSignInMessage(wallet: string, challenge: string): string {
  const issuedAt = new Date().toISOString();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return [
    "Solana Intelligence wants you to sign in with your Solana account:",
    wallet,
    "",
    `URI: ${appUrl}`,
    "Version: 1",
    "Chain ID: mainnet",
    `Nonce: ${challenge}`,
    `Issued At: ${issuedAt}`,
  ].join("\n");
}

export function createChallenge(wallet: string): string {
  const issuedAt = Date.now();
  const mac = createHmac("sha256", getAuthSecret())
    .update(`${wallet}:${issuedAt}`)
    .digest("hex")
    .slice(0, 24);

  return `${issuedAt}.${mac}`;
}

export function verifyChallenge(wallet: string, challenge: string): boolean {
  const [issuedAtRaw, mac] = challenge.split(".");
  if (!issuedAtRaw || !mac) return false;

  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > CHALLENGE_TTL_MS) return false;

  const expected = createHmac("sha256", getAuthSecret())
    .update(`${wallet}:${issuedAt}`)
    .digest("hex")
    .slice(0, 24);

  return mac === expected;
}

export function verifyWalletSignature(
  wallet: string,
  message: string,
  signatureBase58: string
): boolean {
  try {
    const publicKey = new PublicKey(wallet);
    const messageBytes = new TextEncoder().encode(message);
    const signature = bs58.decode(signatureBase58);

    return nacl.sign.detached.verify(
      messageBytes,
      signature,
      publicKey.toBytes()
    );
  } catch {
    return false;
  }
}

export function createSessionToken(wallet: string): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `${wallet}:${exp}`;
  const sig = createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("hex");

  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function parseSessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon === -1) return null;

    const sig = decoded.slice(lastColon + 1);
    const payload = decoded.slice(0, lastColon);
    const walletEnd = payload.lastIndexOf(":");
    if (walletEnd === -1) return null;

    const wallet = payload.slice(0, walletEnd);
    const exp = Number(payload.slice(walletEnd + 1));
    if (!Number.isFinite(exp) || Date.now() > exp) return null;

    const expectedSig = createHmac("sha256", getAuthSecret())
      .update(payload)
      .digest("hex");

    if (sig.length !== expectedSig.length) return null;
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return null;
    }

    const parsed = safeParseSolanaAddress(wallet);
    if (!parsed.success) return null;

    return wallet;
  } catch {
    return null;
  }
}

export function getWalletFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`)
  );
  if (!match?.[1]) return null;

  return parseSessionToken(decodeURIComponent(match[1]));
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  };
}