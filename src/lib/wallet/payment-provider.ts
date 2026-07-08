import type { Transaction } from "@solana/web3.js";
import { getActiveWallet } from "./active-wallet";
import { discoverWallets } from "./discover";

const ADAPTER_STORAGE_KEY = "zenerating_wallet_adapter_id";

export interface LegacyPaymentProvider {
  publicKey?: { toBase58(): string } | null;
  connect(): Promise<{ publicKey: { toBase58(): string } }>;
  signAndSendTransaction(
    transaction: Transaction,
    options?: { skipPreflight?: boolean }
  ): Promise<{ signature: string | Uint8Array }>;
}

function isPaymentProvider(provider: unknown): provider is LegacyPaymentProvider {
  return (
    typeof provider === "object" &&
    provider !== null &&
    typeof (provider as LegacyPaymentProvider).connect === "function" &&
    typeof (provider as LegacyPaymentProvider).signAndSendTransaction ===
      "function"
  );
}

function providerByAdapterId(adapterId: string): LegacyPaymentProvider | null {
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

  const provider = map[adapterId]?.();
  return isPaymentProvider(provider) ? provider : null;
}

function connectedProviderForWallet(
  expectedWallet: string
): LegacyPaymentProvider | null {
  const adapterIds = [
    "legacy:phantom",
    "legacy:solflare",
    "legacy:jupiter",
    "legacy:backpack",
    "legacy:solana",
  ];

  for (const adapterId of adapterIds) {
    const provider = providerByAdapterId(adapterId);
    if (provider?.publicKey?.toBase58() === expectedWallet) {
      return provider;
    }
  }

  return null;
}

export function rememberWalletAdapterId(adapterId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ADAPTER_STORAGE_KEY, adapterId);
}

export function clearWalletAdapterId(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ADAPTER_STORAGE_KEY);
}

export async function resolvePaymentProvider(
  expectedWallet: string
): Promise<LegacyPaymentProvider> {
  const connected = connectedProviderForWallet(expectedWallet);
  if (connected) return connected;

  const active = getActiveWallet();
  if (active) {
    const provider = providerByAdapterId(active.id);
    if (provider) {
      if (!provider.publicKey) await provider.connect();
      if (provider.publicKey?.toBase58() === expectedWallet) {
        return provider;
      }
    }
  }

  const storedId = sessionStorage.getItem(ADAPTER_STORAGE_KEY);
  if (storedId) {
    const provider = providerByAdapterId(storedId);
    if (provider) {
      try {
        await provider.connect();
        if (provider.publicKey?.toBase58() === expectedWallet) {
          return provider;
        }
      } catch {
        // try other wallets below
      }
    }
  }

  for (const wallet of discoverWallets()) {
    const provider = providerByAdapterId(wallet.id);
    if (!provider) continue;

    try {
      await provider.connect();
      if (provider.publicKey?.toBase58() === expectedWallet) {
        rememberWalletAdapterId(wallet.id);
        return provider;
      }
    } catch {
      // wallet rejected or unavailable
    }
  }

  throw new PaymentProviderError(
    "Authorize your wallet to sign the 0.1 SOL payment. Use the same wallet you signed in with."
  );
}

export class PaymentProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentProviderError";
  }
}