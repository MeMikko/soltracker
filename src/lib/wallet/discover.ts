import { getWallets } from "@wallet-standard/app";
import type { Wallet, WalletAccount } from "@wallet-standard/base";
import { StandardConnect } from "@wallet-standard/features";
import type { StandardConnectFeature } from "@wallet-standard/features";
import {
  SolanaSignMessage,
  type SolanaSignMessageFeature,
} from "@solana/wallet-standard-features";
import type { WalletAdapter } from "./types";

interface LegacyInject {
  id: string;
  name: string;
  icon?: string;
  getProvider: () => LegacyProvider | null | undefined;
}

interface LegacyProvider {
  publicKey?: { toBase58(): string } | null;
  connect(): Promise<{ publicKey: { toBase58(): string } }>;
  disconnect(): Promise<void>;
  signMessage(
    message: Uint8Array,
    display?: string
  ): Promise<{ signature: Uint8Array }>;
}

function isLegacyProvider(
  provider: LegacyProvider | null | undefined
): provider is LegacyProvider {
  return (
    typeof provider?.connect === "function" &&
    typeof provider?.signMessage === "function"
  );
}

function isSolanaAccount(account: WalletAccount): boolean {
  return account.chains.some((chain) => chain.startsWith("solana:"));
}

function legacyAdapter(inject: LegacyInject, provider: LegacyProvider): WalletAdapter {
  return {
    id: inject.id,
    name: inject.name,
    icon: inject.icon,
    async connect() {
      const result = await provider.connect();
      return result.publicKey.toBase58();
    },
    async signMessage(message) {
      const signed = await provider.signMessage(message, "utf8");
      return signed.signature;
    },
    async disconnect() {
      await provider.disconnect();
    },
  };
}

function standardAdapter(wallet: Wallet): WalletAdapter | null {
  const connectFeature = wallet.features[StandardConnect] as
    | StandardConnectFeature[typeof StandardConnect]
    | undefined;
  const signFeature = wallet.features[SolanaSignMessage] as
    | SolanaSignMessageFeature[typeof SolanaSignMessage]
    | undefined;

  if (!connectFeature?.connect || !signFeature?.signMessage) {
    return null;
  }

  let activeAccount: WalletAccount | null = null;

  return {
    id: `standard:${wallet.name}`,
    name: wallet.name,
    icon: wallet.icon,
    async connect() {
      const { accounts } = await connectFeature.connect();
      const account = accounts.find(isSolanaAccount);
      if (!account) {
        throw new Error("No Solana account found in wallet");
      }
      activeAccount = account;
      return account.address;
    },
    async signMessage(message) {
      if (!activeAccount) {
        const { accounts } = await connectFeature.connect({ silent: true });
        activeAccount = accounts.find(isSolanaAccount) ?? null;
      }
      if (!activeAccount) {
        throw new Error("Wallet not connected");
      }

      const [output] = await signFeature.signMessage({
        account: activeAccount,
        message,
      });
      return output.signature;
    },
    async disconnect() {
      activeAccount = null;
      const disconnectFeature = wallet.features["standard:disconnect"] as
        | { disconnect: () => Promise<void> }
        | undefined;
      if (disconnectFeature?.disconnect) {
        await disconnectFeature.disconnect();
      }
    },
  };
}

const LEGACY_INJECTS: LegacyInject[] = [
  {
    id: "legacy:phantom",
    name: "Phantom",
    icon: "https://phantom.app/img/phantom-icon-purple.svg",
    getProvider: () =>
      typeof window !== "undefined" ? window.phantom?.solana : null,
  },
  {
    id: "legacy:solflare",
    name: "Solflare",
    getProvider: () =>
      typeof window !== "undefined" ? window.solflare?.solana : null,
  },
  {
    id: "legacy:jupiter",
    name: "Jupiter",
    icon: "https://jup.ag/favicon.ico",
    getProvider: () => {
      if (typeof window === "undefined") return null;
      return (
        window.jupiter?.solana ??
        window.jupiterWallet?.solana ??
        window.JupiterWallet?.solana ??
        null
      );
    },
  },
  {
    id: "legacy:backpack",
    name: "Backpack",
    getProvider: () =>
      typeof window !== "undefined" ? window.backpack?.solana : null,
  },
];

function dedupeWallets(wallets: WalletAdapter[]): WalletAdapter[] {
  const seen = new Set<string>();
  return wallets.filter((wallet) => {
    const key = wallet.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function discoverWallets(): WalletAdapter[] {
  if (typeof window === "undefined") return [];

  const found: WalletAdapter[] = [];

  try {
    for (const wallet of getWallets().get()) {
      const adapter = standardAdapter(wallet);
      if (adapter) found.push(adapter);
    }
  } catch {
    // Wallet Standard unavailable — fall back to legacy injects only.
  }

  for (const inject of LEGACY_INJECTS) {
    const provider = inject.getProvider();
    if (isLegacyProvider(provider)) {
      found.push(legacyAdapter(inject, provider));
    }
  }

  // Generic window.solana fallback (non-Phantom injects)
  const generic = window.solana;
  if (
    isLegacyProvider(generic) &&
    !generic.isPhantom &&
    !found.some((w) => w.name.toLowerCase() === "phantom")
  ) {
    found.push(
      legacyAdapter(
        {
          id: "legacy:solana",
          name: "Solana Wallet",
          getProvider: () => generic,
        },
        generic
      )
    );
  }

  return dedupeWallets(found);
}

export function subscribeWalletDiscovery(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  try {
    return getWallets().on("register", onChange);
  } catch {
    return () => undefined;
  }
}

export const WALLET_INSTALL_LINKS = [
  {
    name: "Jupiter",
    url: "https://chromewebstore.google.com/detail/jupiter-wallet/iledlaeogohbilgbfhmbgkgmpplbfboh",
  },
  {
    name: "Phantom",
    url: "https://phantom.app/download",
  },
  {
    name: "Solflare",
    url: "https://solflare.com/download",
  },
] as const;

declare global {
  interface Window {
    solana?: LegacyProvider & { isPhantom?: boolean };
    phantom?: { solana?: LegacyProvider };
    solflare?: { solana?: LegacyProvider };
    backpack?: { solana?: LegacyProvider };
    jupiter?: { solana?: LegacyProvider };
    jupiterWallet?: { solana?: LegacyProvider };
    JupiterWallet?: { solana?: LegacyProvider };
  }
}