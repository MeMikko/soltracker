import type { TokenChainData, WalletChainData } from "@/lib/helius/index";
import type { TokenDetails, WalletDetails } from "@/lib/types";

export function toWalletDetails(data: WalletChainData): WalletDetails {
  const ageDays = data.firstSeenAt
    ? Math.floor(
        (Date.now() - data.firstSeenAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  return {
    address: data.address,
    ageDays,
    solBalance: data.solBalance,
    tokenCount: data.tokenCount,
    txCount: data.txCount,
    firstTx: data.firstSeenAt?.toISOString() ?? null,
    lastTx: data.lastSeenAt?.toISOString() ?? null,
  };
}

export function toTokenDetails(data: TokenChainData): TokenDetails {
  return {
    mint: data.mintAddress,
    name: data.name,
    symbol: data.symbol,
    imageUrl: data.imageUrl,
    supply: Number(data.supply),
    decimals: data.decimals,
    creator: data.creatorWallet,
    holderCount: data.holderCount,
    lp: data.lp,
    mintAuthority: data.mintAuthority,
    freezeAuthority: data.freezeAuthority,
    mintAuthorityRevoked: data.mintAuthorityRevoked,
    freezeAuthorityRevoked: data.freezeAuthorityRevoked,
  };
}