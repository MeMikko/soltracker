import { getWallets } from "@wallet-standard/app";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import { StandardConnect } from "@wallet-standard/features";
import type { StandardConnectFeature } from "@wallet-standard/features";
import {
  SolanaSignAndSendTransaction,
  SolanaSignTransaction,
  type SolanaSignAndSendTransactionFeature,
  type SolanaSignTransactionFeature,
} from "@solana/wallet-standard-features";
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
import { rememberWalletAdapterId } from "./payment-provider";

const ADAPTER_STORAGE_KEY = "zenerating_wallet_adapter_id";

interface LegacyProvider {
  publicKey?: PublicKey | { toBase58(): string } | null;
  connect?(options?: { onlyIfTrusted?: boolean }): Promise<{
    publicKey: PublicKey | { toBase58(): string };
  }>;
  signAndSendTransaction?(
    transaction: Transaction,
    options?: { skipPreflight?: boolean }
  ): Promise<string | { signature: string | Uint8Array }>;
  signTransaction?(
    transaction: Transaction
  ): Promise<Transaction | { serialize(): Uint8Array }>;
}

function pubkeyString(key: PublicKey | { toBase58(): string }): string {
  return typeof key === "object" && "toBase58" in key
    ? key.toBase58()
    : String(key);
}

function legacyInjects(): Array<{ id: string; getProvider: () => unknown }> {
  if (typeof window === "undefined") return [];

  return [
    {
      id: "legacy:phantom",
      getProvider: () => window.phantom?.solana as unknown,
    },
    {
      id: "legacy:jupiter",
      getProvider: () =>
        (window.jupiter?.solana ??
          window.jupiterWallet?.solana ??
          window.JupiterWallet?.solana) as unknown,
    },
    {
      id: "legacy:solflare",
      getProvider: () => window.solflare?.solana as unknown,
    },
    {
      id: "legacy:backpack",
      getProvider: () => window.backpack?.solana as unknown,
    },
    {
      id: "legacy:solana",
      getProvider: () => window.solana as unknown,
    },
  ];
}

function isLegacyProvider(provider: unknown): provider is LegacyProvider {
  return (
    typeof provider === "object" &&
    provider !== null &&
    (typeof (provider as LegacyProvider).signAndSendTransaction === "function" ||
      typeof (provider as LegacyProvider).signTransaction === "function")
  );
}

function normalizeSignature(signature: string | Uint8Array): string {
  if (typeof signature === "string") return signature;
  return bs58.encode(signature);
}

function extractSignature(result: unknown): string | null {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return null;

  const record = result as Record<string, unknown>;
  if (typeof record.signature === "string") return record.signature;
  if (record.signature instanceof Uint8Array) {
    return bs58.encode(record.signature);
  }
  return null;
}

async function fetchBlockhash(): Promise<string> {
  const res = await fetch("/api/solana/blockhash", { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ?? "Failed to fetch blockhash"
    );
  }
  const { blockhash } = (await res.json()) as { blockhash: string };
  return blockhash;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function broadcastSignedTransaction(
  signed: Uint8Array
): Promise<string> {
  const base64 = bytesToBase64(signed);
  const res = await fetch("/api/solana/send", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: base64 }),
  });

  const body = (await res.json()) as { signature?: string; error?: string };
  if (!res.ok || !body.signature) {
    throw new Error(body.error ?? "Failed to broadcast transaction");
  }

  return body.signature;
}

export async function buildProPaymentTransaction(
  sessionWallet: string
): Promise<Transaction> {
  const blockhash = await fetchBlockhash();
  const fromPubkey = new PublicKey(sessionWallet);
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey: new PublicKey(PRO_TREASURY_WALLET),
      lamports: PRO_PRICE_LAMPORTS,
    })
  );
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;
  return transaction;
}

function solanaAccount(account: WalletAccount): boolean {
  return account.chains.some((chain) => chain.startsWith("solana:"));
}

async function findStandardWalletAccount(
  expectedWallet: string
): Promise<{ wallet: Wallet; account: WalletAccount } | null> {
  for (const wallet of getWallets().get()) {
    for (const account of wallet.accounts) {
      if (account.address === expectedWallet && solanaAccount(account)) {
        return { wallet, account };
      }
    }
  }
  return null;
}

async function connectStandardWallet(
  expectedWallet: string
): Promise<{ wallet: Wallet; account: WalletAccount } | null> {
  for (const wallet of getWallets().get()) {
    const hasPayment =
      wallet.features[SolanaSignAndSendTransaction] ||
      wallet.features[SolanaSignTransaction];
    if (!hasPayment) continue;

    const connectFeature = wallet.features[StandardConnect] as
      | StandardConnectFeature[typeof StandardConnect]
      | undefined;
    if (!connectFeature?.connect) continue;

    try {
      const { accounts } = await connectFeature.connect();
      const account = accounts.find(
        (entry) => entry.address === expectedWallet && solanaAccount(entry)
      );
      if (account) {
        rememberWalletAdapterId(`standard:${wallet.name}`);
        return { wallet, account };
      }
    } catch {
      // try next wallet
    }
  }

  return null;
}

async function tryWalletStandardPayment(
  expectedWallet: string,
  transaction: Transaction
): Promise<string | null> {
  let match =
    (await findStandardWalletAccount(expectedWallet)) ??
    (await connectStandardWallet(expectedWallet));

  if (!match) return null;

  const { wallet, account } = match;
  const serialized = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
  const chain =
    account.chains.find((c) => c.startsWith("solana:")) ?? "solana:mainnet";

  const signAndSend = wallet.features[
    SolanaSignAndSendTransaction
  ] as SolanaSignAndSendTransactionFeature[typeof SolanaSignAndSendTransaction];

  if (signAndSend?.signAndSendTransaction) {
    const [output] = await signAndSend.signAndSendTransaction({
      account,
      transaction: serialized,
      chain,
    });
    return bs58.encode(output.signature);
  }

  const signTx = wallet.features[
    SolanaSignTransaction
  ] as SolanaSignTransactionFeature[typeof SolanaSignTransaction];

  if (signTx?.signTransaction) {
    const [output] = await signTx.signTransaction({
      account,
      transaction: serialized,
      chain,
    });
    return broadcastSignedTransaction(output.signedTransaction);
  }

  return null;
}

async function ensureLegacyConnected(
  provider: LegacyProvider,
  expectedWallet: string,
  adapterId: string
): Promise<boolean> {
  const current = provider.publicKey
    ? pubkeyString(provider.publicKey)
    : null;
  if (current === expectedWallet) return true;

  if (!provider.connect) return false;

  try {
    const result = await provider.connect();
    if (pubkeyString(result.publicKey) === expectedWallet) {
      rememberWalletAdapterId(adapterId);
      return true;
    }
  } catch {
    try {
      const result = await provider.connect({ onlyIfTrusted: true });
      if (pubkeyString(result.publicKey) === expectedWallet) {
        rememberWalletAdapterId(adapterId);
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

async function tryLegacyPayment(
  expectedWallet: string,
  transaction: Transaction
): Promise<string | null> {
  const storedId =
    typeof window !== "undefined"
      ? sessionStorage.getItem(ADAPTER_STORAGE_KEY)
      : null;

  const ordered = legacyInjects();
  if (storedId) {
    ordered.sort((a, b) => {
      if (a.id === storedId) return -1;
      if (b.id === storedId) return 1;
      return 0;
    });
  }

  for (const inject of ordered) {
    const provider = inject.getProvider();
    if (!isLegacyProvider(provider)) continue;

    const ready = await ensureLegacyConnected(
      provider,
      expectedWallet,
      inject.id
    );
    if (!ready) continue;

    if (provider.signAndSendTransaction) {
      try {
        const result = await provider.signAndSendTransaction(transaction);
        const signature = extractSignature(result);
        if (signature) return signature;
      } catch {
        // fall through to signTransaction
      }
    }

    if (provider.signTransaction) {
      try {
        const signed = await provider.signTransaction(transaction);
        const bytes =
          signed instanceof Transaction
            ? signed.serialize()
            : signed.serialize();
        return broadcastSignedTransaction(bytes);
      } catch {
        // try next provider
      }
    }
  }

  return null;
}

export async function preparePaymentWallet(
  expectedWallet: string
): Promise<void> {
  if (await findStandardWalletAccount(expectedWallet)) return;

  for (const inject of legacyInjects()) {
    const provider = inject.getProvider();
    if (!isLegacyProvider(provider)) continue;
    if (await ensureLegacyConnected(provider, expectedWallet, inject.id)) {
      return;
    }
  }

  if (await connectStandardWallet(expectedWallet)) return;

  throw new Error(
    "Open your wallet extension and approve the connection for this site, then try Pay again."
  );
}

export async function sendProSubscriptionPayment(
  sessionWallet: string
): Promise<string> {
  await preparePaymentWallet(sessionWallet);

  const transaction = await buildProPaymentTransaction(sessionWallet);

  const standardSig = await tryWalletStandardPayment(sessionWallet, transaction);
  if (standardSig) return standardSig;

  const legacySig = await tryLegacyPayment(sessionWallet, transaction);
  if (legacySig) return legacySig;

  throw new Error(
    "Could not open a payment prompt in your wallet. Try Phantom or Jupiter, approve the connection, then press Pay again."
  );
}