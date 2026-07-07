import type { WalletAdapter } from "./types";

let activeAdapter: WalletAdapter | null = null;

export function setActiveWallet(adapter: WalletAdapter | null): void {
  activeAdapter = adapter;
}

export function getActiveWallet(): WalletAdapter | null {
  return activeAdapter;
}