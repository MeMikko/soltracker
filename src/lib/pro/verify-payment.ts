import { heliusRpc } from "@/lib/helius/client";
import { PRO_PRICE_LAMPORTS, PRO_TREASURY_WALLET } from "./config";

interface AccountKey {
  pubkey: string;
  signer?: boolean;
}

interface TransferTxMeta {
  err: unknown;
  preBalances: number[];
  postBalances: number[];
}

interface TransferTx {
  meta: TransferTxMeta | null;
  blockTime: number | null;
  transaction: {
    message: {
      accountKeys: Array<string | AccountKey>;
    };
  };
}

function accountPubkeys(
  keys: Array<string | AccountKey>
): string[] {
  return keys.map((key) => (typeof key === "string" ? key : key.pubkey));
}

export function parseTransferAmount(
  tx: TransferTx,
  fromWallet: string,
  toWallet: string
): number | null {
  if (!tx.meta || tx.meta.err) return null;

  const keys = accountPubkeys(tx.transaction.message.accountKeys);
  const fromIdx = keys.indexOf(fromWallet);
  const toIdx = keys.indexOf(toWallet);

  if (fromIdx === -1 || toIdx === -1) return null;

  const received =
    tx.meta.postBalances[toIdx] - tx.meta.preBalances[toIdx];
  const sent = tx.meta.preBalances[fromIdx] - tx.meta.postBalances[fromIdx];

  if (received < PRO_PRICE_LAMPORTS || sent < PRO_PRICE_LAMPORTS) {
    return null;
  }

  return received;
}

export async function verifyProPaymentSignature(
  signature: string,
  payerWallet: string
): Promise<{ lamports: number; paidAt: Date }> {
  const tx = await heliusRpc<TransferTx | null>("getTransaction", [
    signature,
    {
      encoding: "jsonParsed",
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    },
  ]);

  if (!tx) {
    throw new ProPaymentVerificationError(
      "Transaction not found yet — wait a few seconds and try again"
    );
  }

  const lamports = parseTransferAmount(
    tx,
    payerWallet,
    PRO_TREASURY_WALLET
  );

  if (lamports === null) {
    throw new ProPaymentVerificationError(
      `Payment must be exactly ${PRO_PRICE_LAMPORTS / 1e9} SOL to the treasury wallet`
    );
  }

  const paidAt = tx.blockTime
    ? new Date(tx.blockTime * 1000)
    : new Date();

  return { lamports, paidAt };
}

export class ProPaymentVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProPaymentVerificationError";
  }
}