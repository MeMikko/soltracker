export class WalletAuthRequiredError extends Error {
  constructor() {
    super("Connect your Solana wallet to search");
    this.name = "WalletAuthRequiredError";
  }
}