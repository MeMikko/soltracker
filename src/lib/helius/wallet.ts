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
    fetchAllSignatures(address),
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

async function fetchAllSignatures(address: string): Promise<SignatureInfo[]> {
  const collected: SignatureInfo[] = [];
  let before: string | undefined;

  // Paginate through history; cap at 5k signatures for MVP performance.
  while (collected.length < 5_000) {
    const config: { limit: number; before?: string } = { limit: 1000 };
    if (before) {
      config.before = before;
    }

    const page = await heliusRpc<SignatureInfo[]>("getSignaturesForAddress", [
      address,
      config,
    ]);

    if (page.length === 0) {
      break;
    }

    collected.push(...page);
    before = page[page.length - 1]?.signature;

    if (page.length < 1000) {
      break;
    }
  }

  return collected;
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