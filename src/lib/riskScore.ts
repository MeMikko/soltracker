import type { EntityType, RiskFactor, RiskLevel, RiskResponse } from "./types";
import type { TokenChainData, WalletChainData } from "./helius/index";

const BASELINE = 100;

export interface RiskFactorBreakdown {
  id: string;
  label: string;
  deduction: number;
  maxDeduction: number;
  description: string;
}

export interface TokenRiskInput {
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  topHolderPercent: number | null;
  lp: {
    hasLp: boolean;
    liquidityLocked?: boolean;
  };
}

export interface WalletRiskInput {
  ageDays: number;
  txCount: number;
  solBalance: number;
  tokenCount: number;
}

function levelFromScore(score: number): RiskLevel {
  // Higher score = safer (fewer deductions from the 100 baseline).
  if (score >= 70) return "low";
  if (score >= 40) return "medium";
  return "high";
}

function toRiskFactors(factors: RiskFactorBreakdown[]): RiskFactor[] {
  return factors.map((factor) => ({
    id: factor.id,
    label: factor.label,
    score: factor.deduction,
    maxScore: factor.maxDeduction,
    description: factor.description,
  }));
}

function finalizeScore(
  factors: RiskFactorBreakdown[]
): { score: number; breakdown: RiskFactorBreakdown[] } {
  const totalDeduction = factors.reduce((sum, f) => sum + f.deduction, 0);
  const score = Math.max(0, Math.min(BASELINE, BASELINE - totalDeduction));
  return { score, breakdown: factors };
}

export function calculateTokenRiskScore(
  input: TokenRiskInput
): { score: number; breakdown: RiskFactorBreakdown[] } {
  const factors: RiskFactorBreakdown[] = [];

  const mintDeduction = input.mintAuthorityRevoked ? 0 : 30;
  factors.push({
    id: "mint_authority",
    label: "Mint authority",
    deduction: mintDeduction,
    maxDeduction: 30,
    description: input.mintAuthorityRevoked
      ? "Mint authority revoked"
      : "Mint authority is active — supply can be inflated",
  });

  const freezeDeduction = input.freezeAuthorityRevoked ? 0 : 20;
  factors.push({
    id: "freeze_authority",
    label: "Freeze authority",
    deduction: freezeDeduction,
    maxDeduction: 20,
    description: input.freezeAuthorityRevoked
      ? "Freeze authority revoked"
      : "Freeze authority is active — accounts can be frozen",
  });

  const concentrationDeduction =
    input.topHolderPercent !== null && input.topHolderPercent > 20 ? 20 : 0;
  factors.push({
    id: "holder_concentration",
    label: "Top holder concentration",
    deduction: concentrationDeduction,
    maxDeduction: 20,
    description:
      input.topHolderPercent === null
        ? "Top holder concentration unknown"
        : input.topHolderPercent > 20
          ? `Top holder controls ${input.topHolderPercent}% of supply`
          : `Top holder controls ${input.topHolderPercent}% of supply`,
  });

  const lpDeduction =
    !input.lp.hasLp || input.lp.liquidityLocked === false ? 30 : 0;
  factors.push({
    id: "liquidity",
    label: "Liquidity pool",
    deduction: lpDeduction,
    maxDeduction: 30,
    description: !input.lp.hasLp
      ? "No liquidity pool detected"
      : input.lp.liquidityLocked === false
        ? "Liquidity pool is unlocked"
        : "Liquidity pool detected",
  });

  return finalizeScore(factors);
}

export function calculateWalletRiskScore(
  input: WalletRiskInput
): { score: number; breakdown: RiskFactorBreakdown[] } {
  const factors: RiskFactorBreakdown[] = [];

  const ageDeduction =
    input.ageDays < 7 ? 25 : input.ageDays < 30 ? 10 : 0;
  factors.push({
    id: "age",
    label: "Account age",
    deduction: ageDeduction,
    maxDeduction: 25,
    description:
      input.ageDays < 7
        ? `Very new wallet (${input.ageDays} days)`
        : input.ageDays < 30
          ? `Relatively new wallet (${input.ageDays} days)`
          : `Established wallet (${input.ageDays} days)`,
  });

  const activityDeduction =
    input.txCount === 0 ? 20 : input.txCount < 5 ? 10 : 0;
  factors.push({
    id: "activity",
    label: "Transaction activity",
    deduction: activityDeduction,
    maxDeduction: 20,
    description:
      input.txCount === 0
        ? "No on-chain activity"
        : `${input.txCount} transactions observed`,
  });

  const balanceDeduction =
    input.solBalance < 0.01 ? 15 : input.solBalance < 0.1 ? 5 : 0;
  factors.push({
    id: "balance",
    label: "SOL balance",
    deduction: balanceDeduction,
    maxDeduction: 15,
    description: `${input.solBalance.toFixed(4)} SOL`,
  });

  const tokenDeduction = input.tokenCount > 50 ? 10 : 0;
  factors.push({
    id: "tokens",
    label: "Token holdings",
    deduction: tokenDeduction,
    maxDeduction: 10,
    description: `${input.tokenCount} tokens held`,
  });

  return finalizeScore(factors);
}

export function estimateTopHolderPercent(holderCount: number): number | null {
  if (holderCount <= 0) return null;
  if (holderCount <= 5) return 55;
  if (holderCount <= 20) return 32;
  if (holderCount <= 100) return 22;
  return 12;
}

export function tokenChainDataToRiskInput(
  data: TokenChainData
): TokenRiskInput {
  return {
    mintAuthorityRevoked: data.mintAuthorityRevoked,
    freezeAuthorityRevoked: data.freezeAuthorityRevoked,
    topHolderPercent:
      data.topHolderPercent ?? estimateTopHolderPercent(data.holderCount),
    lp: {
      hasLp: data.lp.hasLp,
      liquidityLocked: data.lp.hasLp ? true : undefined,
    },
  };
}

export function walletChainDataToRiskInput(
  data: WalletChainData
): WalletRiskInput {
  const ageDays = data.firstSeenAt
    ? Math.floor(
        (Date.now() - data.firstSeenAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    : 0;

  return {
    ageDays,
    txCount: data.txCount,
    solBalance: data.solBalance,
    tokenCount: data.tokenCount,
  };
}

export function buildRiskResponse(
  address: string,
  type: EntityType,
  data: WalletChainData | TokenChainData
): RiskResponse {
  const result =
    type === "token"
      ? calculateTokenRiskScore(
          tokenChainDataToRiskInput(data as TokenChainData)
        )
      : calculateWalletRiskScore(
          walletChainDataToRiskInput(data as WalletChainData)
        );

  return {
    address,
    type,
    score: result.score,
    level: levelFromScore(result.score),
    breakdown: toRiskFactors(result.breakdown),
  };
}