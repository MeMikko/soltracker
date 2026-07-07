import { HeliusError } from "./errors";
import { heliusRpc } from "./client";
import type { SignatureInfo, WalletChainData } from "./types";

interface BalanceResult {
  value: number;
}

interface AssetsByOwnerResult {
  total?: number;
}

export async function fetchWalletChainData(
  address: string
): Promise<WalletChainData> {
  const [balance, assets, signatures] = await Promise.all([
    heliusRpc<BalanceResult>("getBalance", [address]),
    heliusRpc<AssetsByOwnerResult>("getAssetsByOwner", {
      ownerAddress: address,
      page: 1,
      limit: 1,
      options: {
        showFungible: true,
        showGrandTotal: true,
      },
    }),
    fetchRecentSignatures(address),
  ]);

  const blockTimes = signatures
    .map((entry) => entry.blockTime)
    .filter((value): value is number => typeof value === "number");

  const firstSeenAt =
    blockTimes.length > 0
      ? new Date(Math.min(...blockTimes) * 1000)
      : null;
  const lastSeenAt =
    blockTimes.length > 0
      ? new Date(Math.max(...blockTimes) * 1000)
      : null;

  return {
    address,
    solBalance: balance.value / 1e9,
    tokenCount: assets.total ?? 0,
    txCount: signatures.length,
    firstSeenAt,
    lastSeenAt,
  };
}

// One page keeps serverless handlers within Vercel's timeout budget.
const SIGNATURE_PAGE_LIMIT = 1_000;

async function fetchRecentSignatures(address: string): Promise<SignatureInfo[]> {
  return heliusRpc<SignatureInfo[]>("getSignaturesForAddress", [
    address,
    { limit: SIGNATURE_PAGE_LIMIT },
  ]);
}

export async function assertWalletExists(address: string): Promise<void> {
  const account = await heliusRpc<{ value: unknown | null }>("getAccountInfo", [
    address,
    { encoding: "base64" },
  ]);

  if (!account.value) {
    throw new HeliusError("Wallet account not found on-chain", "NOT_FOUND");
  }
}