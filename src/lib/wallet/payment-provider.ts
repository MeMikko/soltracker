const ADAPTER_STORAGE_KEY = "zenerating_wallet_adapter_id";
const ADAPTER_NAME_KEY = "zenerating_wallet_name";

export function rememberWalletAdapter(
  adapterId: string,
  adapterName?: string
): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ADAPTER_STORAGE_KEY, adapterId);
  if (adapterName) {
    sessionStorage.setItem(ADAPTER_NAME_KEY, adapterName);
  }
}

/** @deprecated Use rememberWalletAdapter */
export function rememberWalletAdapterId(adapterId: string): void {
  rememberWalletAdapter(adapterId);
}

export function clearWalletAdapterId(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ADAPTER_STORAGE_KEY);
  sessionStorage.removeItem(ADAPTER_NAME_KEY);
}

export function getStoredWalletAdapterId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADAPTER_STORAGE_KEY);
}

export function getStoredWalletName(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADAPTER_NAME_KEY);
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function mobilePaymentHint(walletName: string | null): string | null {
  if (!isMobileDevice()) return null;
  const name = walletName ?? "Jupiter";
  return `On mobile, open Zenerating inside the ${name} app browser (Wallet → Browser), connect, then tap Pay. Safari/Chrome alone cannot sign transactions.`;
}