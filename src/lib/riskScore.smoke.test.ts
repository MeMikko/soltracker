import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateTokenRiskScore,
  calculateWalletRiskScore,
} from "./riskScore";

describe("calculateTokenRiskScore", () => {
  it("returns maximum score when all risk factors are clear", () => {
    const result = calculateTokenRiskScore({
      mintAuthorityRevoked: true,
      freezeAuthorityRevoked: true,
      topHolderPercent: 12,
      lp: { hasLp: true, liquidityLocked: true },
    });

    assert.equal(result.score, 100);
    assert.equal(
      result.breakdown.reduce((sum, factor) => sum + factor.deduction, 0),
      0
    );
  });

  it("applies full deductions for a high-risk token profile", () => {
    const result = calculateTokenRiskScore({
      mintAuthorityRevoked: false,
      freezeAuthorityRevoked: false,
      topHolderPercent: 45,
      lp: { hasLp: false },
    });

    assert.equal(result.score, 0);
    assert.deepEqual(
      result.breakdown.map((factor) => factor.deduction),
      [30, 20, 20, 30]
    );
  });

  it("applies partial deductions for mixed risk signals", () => {
    const result = calculateTokenRiskScore({
      mintAuthorityRevoked: true,
      freezeAuthorityRevoked: false,
      topHolderPercent: 8,
      lp: { hasLp: true, liquidityLocked: true },
    });

    assert.equal(result.score, 80);
    const freeze = result.breakdown.find((f) => f.id === "freeze_authority");
    assert.equal(freeze?.deduction, 20);
  });
});

describe("calculateWalletRiskScore", () => {
  it("penalizes very new wallets with low activity", () => {
    const result = calculateWalletRiskScore({
      ageDays: 2,
      txCount: 0,
      solBalance: 0,
      tokenCount: 0,
    });

    assert.equal(result.score, 40);
  });
});