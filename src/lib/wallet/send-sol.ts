import {
  PublicKey,
  SystemProgram,
  Transaction,
  type TransactionSignature,
} from "@solana/web3.js";
import bs58 from "bs58";
import {
  PRO_PRICE_LAMPORTS,
  PRO_TREASURY_WALLET,
} from "@/lib/pro/config";
import { getActiveWallet } from "./active-wallet";

interface LegacySendProvider {
  publicKey?: { toBase58(): string } | null;
  connect(): Promise<{ publicKey: { toBase58(): string } }>;
  signAndSendTransaction(
    transaction: Transaction,
    options?: { skipPreflight?: boolean }
  ): Promise<{ signature: TransactionSignature | Uint8Array }>;
}

function isLegacySendProvider(
  provider: unknown
): provider is LegacySendProvider {
  return (
    typeof provider === "object" &&
    provider !== null &&
    typeof (provider as LegacySendProvider).connect === "function" &&
    typeof (provider as LegacySendProvider).signAndSendTransaction === "function"
  );
}

function resolveProviderForAdapter(adapterId: string): LegacySendProvider | null {
  if (typeof window === "undefined") return null;

  const map: Record<string, () => unknown> = {
    "legacy:phantom": () => window.phantom?.solana,
    "legacy:solflare": () => window.solflare?.solana,
    "legacy:jupiter": () =>
      window.jupiter?.solana ??
      window.jupiterWallet?.solana ??
      window.JupiterWallet?.solana,
    "legacy:backpack": () => window.backpack?.solana,
    "legacy:solana": () => window.solana,
  };

  const fromId = map[adapterId]?.();
  if (isLegacySendProvider(fromId)) return fromId;

  const generic = window.solana;
  if (isLegacySendProvider(generic)) return generic;

  return null;
}

function normalizeSignature(
  signature: TransactionSignature | Uint8Array
): string {
  if (typeof signature === "string") return signature;
  return bs58.encode(signature);
}

async function fetchBlockhash(): Promise<string> {
  const res = await fetch("/api/solana/blockhash", { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to fetch blockhash");
  }
  const { blockhash } = (await res.json()) as { blockhash: string };
  return blockhash;
}

export async function sendProSubscriptionPayment(): Promise<string> {
  const adapter = getActiveWallet();
  if (!adapter) {
    throw new Error("Connect your wallet before upgrading to Pro");
  }

  const provider = resolveProviderForAdapter(adapter.id);
  if (!provider) {
    throw new Error(
      "Your wallet cannot send SOL from the browser. Try Phantom, Jupiter, or Solflare."
    );
  }

  if (!provider.publicKey) {
    await provider.connect();
  }

  const payer = provider.publicKey;
  if (!payer) {
    throw new Error("Wallet public key unavailable");
  }

  const fromPubkey = new PublicKey(payer.toBase58());
  const blockhash = await fetchBlockhash();
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey: new PublicKey(PRO_TREASURY_WALLET),
      lamports: PRO_PRICE_LAMPORTS,
    })
  );
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  const { signature } = await provider.signAndSendTransaction(transaction);
  return normalizeSignature(signature);
}