const GMGN_TOKEN_PREFIX = "https://gmgn.ai/sol/token/wtUVmpgu_";

export function getGmgnTradeUrl(mintAddress: string): string {
  return `${GMGN_TOKEN_PREFIX}${mintAddress}`;
}