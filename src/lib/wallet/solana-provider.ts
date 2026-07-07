import bs58 from "bs58";

export { discoverWallets, subscribeWalletDiscovery, WALLET_INSTALL_LINKS } from "./discover";
export { getActiveWallet, setActiveWallet } from "./active-wallet";
export type { WalletAdapter } from "./types";

export function signatureToBase58(signature: Uint8Array): string {
  return bs58.encode(signature);
}