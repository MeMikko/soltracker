export type EntityType = "wallet" | "token";

export interface WalletChainData {
  address: string;
  solBalance: number;
  tokenCount: number;
  txCount: number;
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
}

export interface TokenLpInfo {
  hasLp: boolean;
  poolAddress: string | null;
  liquidityUsd: number | null;
  dex: string | null;
  priceUsd: number | null;
  marketCapUsd: number | null;
  priceChange24h: number | null;
}

export interface TokenMetadata {
  name: string | null;
  symbol: string | null;
  imageUrl: string | null;
}

export interface TokenChainData {
  mintAddress: string;
  name: string | null;
  symbol: string | null;
  imageUrl: string | null;
  supply: string;
  decimals: number;
  creatorWallet: string | null;
  holderCount: number;
  topHolderPercent: number | null;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  lp: TokenLpInfo;
}

interface JsonRpcError {
  code: number;
  message: string;
}

export interface JsonRpcResponse<T> {
  jsonrpc: "2.0";
  id: string | number;
  result?: T;
  error?: JsonRpcError;
}

export interface HeliusAsset {
  id: string;
  interface?: string;
  content?: {
    metadata?: { name?: string; symbol?: string };
    links?: { image?: string };
    files?: Array<{ uri?: string; cdn_uri?: string }>;
  };
  mint_extensions?: {
    metadata?: { name?: string; symbol?: string };
  };
  token_info?: {
    supply?: number;
    decimals?: number;
    symbol?: string;
    mint_authority?: string;
    freeze_authority?: string;
  };
  authorities?: Array<{ address: string; scopes: string[] }>;
  creators?: Array<{ address: string }>;
}

export interface AccountInfoValue {
  owner: string;
  data?: {
    program?: string;
    parsed?: {
      type?: string;
      info?: {
        mintAuthority?: string | null;
        freezeAuthority?: string | null;
        supply?: string;
        decimals?: number;
        isInitialized?: boolean;
      };
    };
  };
}

export interface SignatureInfo {
  signature: string;
  blockTime: number | null;
  slot: number;
  err: unknown;
}