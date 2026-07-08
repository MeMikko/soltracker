/** Wallets with unlimited searches — not billed against the free tier. */
const BUILTIN_ADMIN_WALLETS = new Set([
  "6fRPW1DWahcznCxzjg8V89FWP1fQ3y4tmkgzwzocjSzb",
]);

function walletsFromEnv(): Set<string> {
  const raw = process.env.ADMIN_WALLETS;
  if (!raw?.trim()) return new Set();

  return new Set(
    raw
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean)
  );
}

let cached: Set<string> | null = null;

function adminWalletSet(): Set<string> {
  if (!cached) {
    cached = new Set([...BUILTIN_ADMIN_WALLETS, ...walletsFromEnv()]);
  }
  return cached;
}

export function isAdminWallet(wallet: string | null | undefined): boolean {
  if (!wallet) return false;
  return adminWalletSet().has(wallet);
}