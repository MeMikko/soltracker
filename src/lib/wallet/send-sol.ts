import {
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import {
  PRO_PRICE_LAMPORTS,
  PRO_TREASURY_WALLET,
} from "@/lib/pro/config";
import { resolvePaymentProvider } from "./payment-provider";

function normalizeSignature(signature: string | Uint8Array): string {
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

export async function sendProSubscriptionPayment(
  sessionWallet: string
): Promise<string> {
  const provider = await resolvePaymentProvider(sessionWallet);

  if (!provider.publicKey) {
    await provider.connect();
  }

  const payer = provider.publicKey;
  if (!payer) {
    throw new Error("Wallet public key unavailable");
  }

  if (payer.toBase58() !== sessionWallet) {
    throw new Error(
      "Connected wallet does not match your signed-in wallet. Reconnect the same wallet."
    );
  }

  const fromPubkey = new PublicKey(sessionWallet);
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