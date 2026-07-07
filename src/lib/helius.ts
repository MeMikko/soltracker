/**
 * Backward-compatible facade over the modular Helius data layer.
 * New code should import from `@/lib/helius/index` or `@/lib/data`.
 */
import {
  detectEntityType,
  fetchTokenChainData,
  fetchWalletChainData,
  hasHeliusApiKey,
} from "./helius/index";
import type { EntityType, TokenChainData, WalletChainData } from "./helius/index";
import type { TokenDetails, WalletDetails } from "./types";

export { hasHeliusApiKey as hasHeliusKey };

export type { EntityType };

function mapWallet(data: WalletChainData): WalletDetails {
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

function mapToken(data: TokenChainData): TokenDetails {
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

export async function fetchWalletDetails(address: string): Promise<WalletDetails> {
  const data = await fetchWalletChainData(address);
  return mapWallet(data);
}

export async function fetchTokenDetails(mint: string): Promise<TokenDetails> {
  const data = await fetchTokenChainData(mint);
  return mapToken(data);
}

export { detectEntityType };