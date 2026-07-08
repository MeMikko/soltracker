import { heliusRpc } from "@/lib/helius/client";
import type { SignatureInfo } from "@/lib/helius/types";
import type { SolTransfer } from "./types";

const SYSTEM_PROGRAM = "11111111111111111111111111111111";
const MAX_SIGNATURES = 40;
const MAX_TX_PARSE = 18;

interface ParsedAccountKey {
  pubkey: string;
  signer: boolean;
  writable: boolean;
}

interface BalanceMeta {
  preBalances: number[];
  postBalances: number[];
}

interface ParsedTransaction {
  blockTime: number | null;
  meta: BalanceMeta | null;
  transaction: {
    message: {
      accountKeys: Array<string | ParsedAccountKey>;
    };
  };
}

function resolvePubkey(key: string | ParsedAccountKey): string {
  return typeof key === "string" ? key : key.pubkey;
}

export async function fetchRecentSignatures(
  address: string,
  limit = MAX_SIGNATURES
): Promise<SignatureInfo[]> {
  return heliusRpc<SignatureInfo[]>("getSignaturesForAddress", [
    address,
    { limit },
  ]);
}

export function extractSolTransfers(
  tx: ParsedTransaction,
  signature: string
): SolTransfer[] {
  const meta = tx.meta;
  if (!meta?.preBalances?.length || !meta.postBalances?.length) {
    return [];
  }

  const keys = tx.transaction.message.accountKeys.map(resolvePubkey);
  const transfers: SolTransfer[] = [];

  for (let i = 0; i < keys.length; i++) {
    const delta = (meta.postBalances[i] ?? 0) - (meta.preBalances[i] ?? 0);
    if (delta === 0) continue;

    if (delta < 0) {
      const sender = keys[i];
      for (let j = 0; j < keys.length; j++) {
        if (i === j) continue;
        const inDelta = (meta.postBalances[j] ?? 0) - (meta.preBalances[j] ?? 0);
        if (inDelta > 0 && keys[j] !== SYSTEM_PROGRAM) {
          transfers.push({
            from: sender,
            to: keys[j],
            lamports: Math.min(Math.abs(delta), inDelta),
            blockTime: tx.blockTime,
            signature,
          });
        }
      }
    }
  }

  return transfers;
}

export async function fetchWalletTransfers(
  address: string
): Promise<SolTransfer[]> {
  const signatures = await fetchRecentSignatures(address);
  const sample = signatures.slice(0, MAX_TX_PARSE);

  const txs = await Promise.all(
    sample.map(async (entry) => {
      try {
        const tx = await heliusRpc<ParsedTransaction | null>("getTransaction", [
          entry.signature,
          { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
        ]);
        if (!tx) return [];
        return extractSolTransfers(tx, entry.signature);
      } catch {
        return [];
      }
    })
  );

  const related = txs.flat().filter((t) => t.from === address || t.to === address);
  const unique = new Map<string, SolTransfer>();

  for (const transfer of related) {
    const key = `${transfer.signature}:${transfer.from}:${transfer.to}`;
    unique.set(key, transfer);
  }

  return [...unique.values()];
}