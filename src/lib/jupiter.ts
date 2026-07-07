const JUPITER_REF = "lpvr44kk5b2t";

export function getJupiterTradeUrl(mintAddress: string): string {
  return `https://jup.ag/tokens/${mintAddress}?ref=${JUPITER_REF}`;
}