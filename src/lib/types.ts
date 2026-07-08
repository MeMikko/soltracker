export type EntityType = "wallet" | "token";

export type RiskLevel = "low" | "medium" | "high";

export interface RiskFactor {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface RiskResponse {
  address: string;
  type: EntityType;
  score: number;
  level: RiskLevel;
  breakdown: RiskFactor[];
  usage?: UsageResponse;
}

export interface HolderDistribution {
  top10Percent: number;
  top50Percent: number;
  giniCoefficient: number;
  whaleCount: number;
}

export interface WalletDetails {
  address: string;
  ageDays: number;
  solBalance: number;
  tokenCount: number;
  txCount: number;
  firstTx: string | null;
  lastTx: string | null;
}

export interface TokenLpInfo {
  hasLp: boolean;
  poolAddress: string | null;
  liquidityUsd: number | null;
  dex: string | null;
}

export interface TokenDetails {
  mint: string;
  name: string | null;
  symbol: string | null;
  imageUrl: string | null;
  supply: number;
  decimals: number;
  creator: string | null;
  holderCount: number;
  lp: TokenLpInfo;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
}

export interface SearchResponse {
  address: string;
  type: EntityType;
}

export interface UsageResponse {
  used: number;
  limit: number;
  remaining: number;
  tier: "free" | "pro" | "admin";
  wallet: string | null;
  authenticated: boolean;
  proExpiresAt?: string | null;
}

export interface AuthSession {
  wallet: string | null;
  authenticated: boolean;
  disabled?: boolean;
}

export interface ApiError {
  error: string;
  code:
    | "INVALID_ADDRESS"
    | "NOT_FOUND"
    | "RATE_LIMIT"
    | "TIMEOUT"
    | "INTERNAL"
    | "WALLET_REQUIRED"
    | "IP_WALLET_LIMIT"
    | "AUTH_EXPIRED"
    | "AUTH_INVALID"
    | "PAYMENT_INVALID"
    | "PAYMENT_USED"
    | "PRO_REQUIRED";
}