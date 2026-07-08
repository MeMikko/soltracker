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
import {
  getStoredWalletAdapterId,
  getStoredWalletName,
  rememberWalletAdapter,
} from "./payment-provider";

const BLOCKED_UNLESS_STORED = ["metamask", "coinbase", "rabby", "brave"];

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

const LEGACY_INJECTS: Array<{ id: string; getProvider: () => unknown }> = [
  {
    id: "legacy:jupiter",
    getProvider: () =>
      (typeof window !== "undefined"
        ? window.jupiter?.solana ??
          window.jupiterWallet?.solana ??
          window.JupiterWallet?.solana
        : null) as unknown,
  },
  {
    id: "legacy:phantom",
    getProvider: () =>
      (typeof window !== "undefined"
        ? window.phantom?.solana
        : null) as unknown,
  },
  {
    id: "legacy:solflare",
    getProvider: () =>
      (typeof window !== "undefined"
        ? window.solflare?.solana
        : null) as unknown,
  },
  {
    id: "legacy:backpack",
    getProvider: () =>
      (typeof window !== "undefined"
        ? window.backpack?.solana
        : null) as unknown,
  },
];

function pubkeyString(key: PublicKey | { toBase58(): string }): string {
  return typeof key === "object" && "toBase58" in key
    ? key.toBase58()
    : String(key);
}

function isLegacyProvider(provider: unknown): provider is LegacyProvider {
  return (
    typeof provider === "object" &&
    provider !== null &&
    (typeof (provider as LegacyProvider).signAndSendTransaction === "function" ||
      typeof (provider as LegacyProvider).signTransaction === "function")
  );
}

function isBlockedWalletName(name: string, storedName: string | null): boolean {
  const lower = name.toLowerCase();
  if (storedName && lower === storedName.toLowerCase()) return false;
  return BLOCKED_UNLESS_STORED.some((blocked) => lower.includes(blocked));
}

function hasSolanaPaymentFeature(wallet: Wallet): boolean {
  return !!(
    wallet.features[SolanaSignAndSendTransaction] ||
    wallet.features[SolanaSignTransaction]
  );
}

function walletNameMatchesStored(
  walletName: string,
  storedId: string | null,
  storedName: string | null
): boolean {
  if (storedName && walletName.toLowerCase() === storedName.toLowerCase()) {
    return true;
  }
  if (storedId?.startsWith("standard:")) {
    const fromId = storedId.slice("standard:".length);
    return walletName.toLowerCase() === fromId.toLowerCase();
  }
  if (storedId === "legacy:jupiter") {
    return walletName.toLowerCase().includes("jupiter");
  }
  if (storedId === "legacy:phantom") {
    return walletName.toLowerCase().includes("phantom");
  }
  if (storedId === "legacy:solflare") {
    return walletName.toLowerCase().includes("solflare");
  }
  if (storedId === "legacy:backpack") {
    return walletName.toLowerCase().includes("backpack");
  }
  return false;
}

function legacyInjectForStored(
  storedId: string | null
): Array<{ id: string; getProvider: () => unknown }> {
  if (storedId?.startsWith("legacy:")) {
    const match = LEGACY_INJECTS.find((inject) => inject.id === storedId);
    if (match) return [match];
  }

  if (storedId?.startsWith("standard:")) {
    const name = storedId.slice("standard:".length).toLowerCase();
    if (name.includes("jupiter")) {
      return LEGACY_INJECTS.filter((i) => i.id === "legacy:jupiter");
    }
    if (name.includes("phantom")) {
      return LEGACY_INJECTS.filter((i) => i.id === "legacy:phantom");
    }
  }

  return LEGACY_INJECTS;
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
  const { blockhash } = (await res.json()) as { blockhash?: string };
  if (!blockhash) {
    throw new Error("Blockhash missing from server response");
  }
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

function findExistingStandardAccount(
  expectedWallet: string,
  storedId: string | null,
  storedName: string | null
): { wallet: Wallet; account: WalletAccount } | null {
  for (const wallet of getWallets().get()) {
    if (!hasSolanaPaymentFeature(wallet)) continue;
    if (isBlockedWalletName(wallet.name, storedName)) continue;
    if (
      storedId &&
      !walletNameMatchesStored(wallet.name, storedId, storedName)
    ) {
      continue;
    }

    const account = wallet.accounts.find(
      (entry) => entry.address === expectedWallet && solanaAccount(entry)
    );
    if (account) return { wallet, account };
  }
  return null;
}

async function connectPreferredStandardWallet(
  expectedWallet: string
): Promise<{ wallet: Wallet; account: WalletAccount } | null> {
  const storedId = getStoredWalletAdapterId();
  const storedName = getStoredWalletName();

  const existing = findExistingStandardAccount(
    expectedWallet,
    storedId,
    storedName
  );
  if (existing) return existing;

  const candidates = getWallets()
    .get()
    .filter((wallet) => {
      if (!hasSolanaPaymentFeature(wallet)) return false;
      if (isBlockedWalletName(wallet.name, storedName)) return false;
      if (!storedId && !storedName) return true;
      return walletNameMatchesStored(wallet.name, storedId, storedName);
    });

  if (candidates.length === 0) return null;

  for (const wallet of candidates) {
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
        rememberWalletAdapter(`standard:${wallet.name}`, wallet.name);
        return { wallet, account };
      }
    } catch {
      // only try the wallet the user signed in with
    }
  }

  return null;
}

async function executeStandardPayment(
  match: { wallet: Wallet; account: WalletAccount },
  transaction: Transaction
): Promise<string | null> {
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
    const result = await provider.connect({ onlyIfTrusted: true });
    if (pubkeyString(result.publicKey) === expectedWallet) {
      rememberWalletAdapter(adapterId);
      return true;
    }
  } catch {
    // fall through to full connect
  }

  try {
    const result = await provider.connect();
    if (pubkeyString(result.publicKey) === expectedWallet) {
      rememberWalletAdapter(adapterId);
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

async function tryLegacyPayment(
  expectedWallet: string,
  transaction: Transaction
): Promise<string | null> {
  const storedId = getStoredWalletAdapterId();
  const injects = legacyInjectForStored(storedId);

  for (const inject of injects) {
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
        // try signTransaction
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
        // try next inject
      }
    }
  }

  return null;
}

export async function preparePaymentWallet(
  expectedWallet: string
): Promise<void> {
  const standard = await connectPreferredStandardWallet(expectedWallet);
  if (standard) return;

  for (const inject of legacyInjectForStored(getStoredWalletAdapterId())) {
    const provider = inject.getProvider();
    if (!isLegacyProvider(provider)) continue;
    if (await ensureLegacyConnected(provider, expectedWallet, inject.id)) {
      return;
    }
  }

  const walletLabel = getStoredWalletName() ?? "your wallet";
  throw new Error(
    `Could not connect ${walletLabel}. Make sure the same account is selected, then try again.`
  );
}

export async function sendProSubscriptionPayment(
  sessionWallet: string
): Promise<string> {
  await preparePaymentWallet(sessionWallet);

  const transaction = await buildProPaymentTransaction(sessionWallet);

  const storedId = getStoredWalletAdapterId();
  const storedName = getStoredWalletName();

  const standardMatch =
    findExistingStandardAccount(sessionWallet, storedId, storedName) ??
    (await connectPreferredStandardWallet(sessionWallet));

  if (standardMatch) {
    const standardSig = await executeStandardPayment(
      standardMatch,
      transaction
    );
    if (standardSig) return standardSig;
  }

  const legacySig = await tryLegacyPayment(sessionWallet, transaction);
  if (legacySig) return legacySig;

  const walletLabel = storedName ?? "wallet";
  throw new Error(
    `Payment was not approved. Approve the 0.1 SOL transfer in ${walletLabel} and try again.`
  );
}