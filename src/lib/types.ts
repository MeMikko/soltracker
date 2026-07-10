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
  priceUsd: number | null;
  marketCapUsd: number | null;
  priceChange24h: number | null;
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

export interface RecentToken {
  mint: string;
  name: string | null;
  symbol: string | null;
  imageUrl: string | null;
  searchCount: number;
  lastSearchedAt: string;
}

export interface UsageResponse {
  used: number;
  limit: number;
  remaining: number;
  bonusSearches?: number;
  tier: "free" | "pro" | "admin";
  wallet: string | null;
  authenticated: boolean;
  proExpiresAt?: string | null;
}

export interface TokenUnlockStatus {
  unlocked: boolean;
  expiresAt: string | null;
  via?: "pro" | "token_unlock" | null;
}

export interface AuthSession {
  wallet: string | null;
  authenticated: boolean;
  disabled?: boolean;
}

export interface AdminDailySearchStat {
  date: string;
  searches: number;
  searchers: number;
}

export interface AdminTopTokenStat {
  mint: string;
  name: string | null;
  symbol: string | null;
  searchCount: number;
  lastSearchedAt: string;
}

export interface AdminProPaymentRow {
  wallet: string;
  sol: number;
  paidAt: string;
  periodEnd: string;
}

export interface AdminPurchaseRow {
  wallet: string;
  product: string;
  sol: number;
  paidAt: string;
  metadata: Record<string, string> | null;
}

export interface FeaturedTokenAdminSetting {
  enabled: boolean;
  mint: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface FeaturedTokenPublic {
  enabled: boolean;
  mint: string | null;
  href: string | null;
  updatedAt: string;
}

export interface AdminAnalytics {
  generatedAt: string;
  databaseAvailable: boolean;
  overview: {
    searchesToday: number;
    searchesLast7Days: number;
    uniqueSearchersToday: number;
    uniqueSearchersLast7Days: number;
    activeProSubscriptions: number;
    activeTokenUnlocks: number;
    bonusSearchesOutstanding: number;
    trackedTokens: number;
    cachedTokens: number;
    cachedWallets: number;
  };
  revenue: {
    proPaymentsCount: number;
    proRevenueSol: number;
    searchPackPurchases: number;
    searchPackRevenueSol: number;
    tokenUnlockPurchases: number;
    tokenUnlockRevenueSol: number;
    totalRevenueSol: number;
  };
  dailySearches: AdminDailySearchStat[];
  topTokens: AdminTopTokenStat[];
  recentProPayments: AdminProPaymentRow[];
  recentPurchases: AdminPurchaseRow[];
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
    | "PRO_REQUIRED"
    | "ADMIN_REQUIRED";
}