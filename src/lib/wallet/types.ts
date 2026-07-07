export interface WalletAdapter {
  id: string;
  name: string;
  icon?: string;
  connect(): Promise<string>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  disconnect(): Promise<void>;
}