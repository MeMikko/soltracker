"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearWalletAdapterId,
  rememberWalletAdapter,
} from "@/lib/wallet/payment-provider";
import {
  discoverWallets,
  getActiveWallet,
  setActiveWallet,
  signatureToBase58,
  subscribeWalletDiscovery,
  WALLET_INSTALL_LINKS,
} from "@/lib/wallet/solana-provider";
import type { WalletAdapter } from "@/lib/wallet/types";
import type { AuthSession } from "@/lib/types";

interface WalletAuthState {
  session: AuthSession | null;
  connecting: boolean;
  pickerOpen: boolean;
  wallets: WalletAdapter[];
  error: string | null;
  beginConnect: () => void;
  connectWith: (wallet: WalletAdapter) => Promise<void>;
  closePicker: () => void;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
}

async function fetchSession(): Promise<AuthSession> {
  const res = await fetch("/api/auth/session", { credentials: "include" });
  return res.json() as Promise<AuthSession>;
}

async function authenticateWallet(adapter: WalletAdapter): Promise<void> {
  const wallet = await adapter.connect();

  const challengeRes = await fetch(
    `/api/auth/challenge?wallet=${encodeURIComponent(wallet)}`,
    { credentials: "include" }
  );

  if (!challengeRes.ok) {
    const body = await challengeRes.json();
    throw new Error(body.error ?? "Failed to start wallet sign-in");
  }

  const { message, challenge } = (await challengeRes.json()) as {
    message: string;
    challenge: string;
  };

  const signature = await adapter.signMessage(new TextEncoder().encode(message));

  const verifyRes = await fetch("/api/auth/verify", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet,
      message,
      challenge,
      signature: signatureToBase58(signature),
    }),
  });

  const verifyBody = await verifyRes.json();
  if (!verifyRes.ok) {
    throw new Error(verifyBody.error ?? "Wallet verification failed");
  }

  setActiveWallet(adapter);
  rememberWalletAdapter(adapter.id, adapter.name);
}

export function useWalletAuth(): WalletAuthState {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [wallets, setWallets] = useState<WalletAdapter[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refreshWallets = useCallback(() => {
    setWallets(discoverWallets());
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchSession();
      setSession(data);
    } catch {
      setSession({ wallet: null, authenticated: false });
    }
  }, []);

  useEffect(() => {
    refresh();
    refreshWallets();

    // Extensions (Jupiter, Phantom) may inject after first paint.
    const delayed = window.setTimeout(refreshWallets, 600);
    const delayedAgain = window.setTimeout(refreshWallets, 2000);

    const unsubscribe = subscribeWalletDiscovery(refreshWallets);
    return () => {
      window.clearTimeout(delayed);
      window.clearTimeout(delayedAgain);
      unsubscribe();
    };
  }, [refresh, refreshWallets]);

  const connectWith = useCallback(
    async (adapter: WalletAdapter) => {
      setConnecting(true);
      setError(null);
      setPickerOpen(false);

      try {
        await authenticateWallet(adapter);
        await refresh();
        window.dispatchEvent(new CustomEvent("wallet-session-changed"));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Wallet connection failed";
        setError(message);

        try {
          await adapter.disconnect();
        } catch {
          // ignore
        }
        setActiveWallet(null);
      } finally {
        setConnecting(false);
      }
    },
    [refresh]
  );

  const beginConnect = useCallback(() => {
    setError(null);

    try {
      const available = discoverWallets();
      setWallets(available);

      if (available.length === 0) {
        const links = WALLET_INSTALL_LINKS.map((w) => w.name).join(", ");
        setError(`No wallet found. Install ${links} and refresh the page.`);
        return;
      }

      if (available.length === 1) {
        void connectWith(available[0]);
        return;
      }

      setPickerOpen(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to detect wallets"
      );
    }
  }, [connectWith]);

  const disconnect = useCallback(async () => {
    setError(null);

    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "include",
      });
      await getActiveWallet()?.disconnect();
    } catch {
      // ignore
    }

    setActiveWallet(null);
    clearWalletAdapterId();
    setSession({ wallet: null, authenticated: false });
    window.dispatchEvent(new CustomEvent("wallet-session-changed"));
  }, []);

  return {
    session,
    connecting,
    pickerOpen,
    wallets,
    error,
    beginConnect,
    connectWith,
    closePicker: () => setPickerOpen(false),
    disconnect,
    refresh,
  };
}