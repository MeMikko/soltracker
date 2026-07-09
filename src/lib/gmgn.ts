const GMGN_TOKEN_PREFIX = "https://gmgn.ai/sol/token/mikk0x_";

export function getGmgnTradeUrl(mintAddress: string): string {
  return `${GMGN_TOKEN_PREFIX}${mintAddress}`;
}