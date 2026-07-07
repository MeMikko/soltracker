import type { EntityType, TokenChainData, WalletChainData } from "./helius/index";

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function mockEntityType(address: string): EntityType {
  if (address.toLowerCase().endsWith("pump")) {
    return "token";
  }
  return hashSeed(address) % 5 === 0 ? "token" : "wallet";
}

export function mockWalletChainData(address: string): WalletChainData {
  const seed = hashSeed(address);
  const ageDays = 5 + (seed % 400);
  const firstSeenAt = new Date(Date.now() - ageDays * 86_400_000);
  const lastSeenAt = new Date(Date.now() - (seed % 48) * 3_600_000);

  return {
    address,
    solBalance: Number(((seed % 500) / 100).toFixed(4)),
    tokenCount: seed % 30,
    txCount: 10 + (seed % 200),
    firstSeenAt,
    lastSeenAt,
  };
}

export function mockTokenChainData(mint: string): TokenChainData {
  const seed = hashSeed(mint);
  const revoked = seed % 3 === 0;
  const hasLp = seed % 2 === 0;

  return {
    mintAddress: mint,
    name: `Demo Token ${mint.slice(0, 4)}`,
    symbol: `D${mint.slice(0, 3).toUpperCase()}`,
    imageUrl: null,
    supply: String(1_000_000_000 * (1 + (seed % 9))),
    decimals: 6 + (seed % 3),
    creatorWallet: `Demo${mint.slice(0, 8)}`,
    holderCount: 20 + (seed % 5000),
    topHolderPercent: 5 + (seed % 30),
    mintAuthority: revoked ? null : `Mint${mint.slice(0, 6)}`,
    freezeAuthority: revoked ? null : `Freeze${mint.slice(0, 6)}`,
    mintAuthorityRevoked: revoked,
    freezeAuthorityRevoked: revoked,
    lp: {
      hasLp,
      poolAddress: hasLp ? `Pool${mint.slice(-8)}` : null,
      liquidityUsd: hasLp ? 5000 + (seed % 50_000) : null,
      dex: hasLp ? "Raydium" : null,
    },
  };
}