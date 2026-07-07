import { Prisma } from "@prisma/client";
import { hasDatabase } from "@/lib/config";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import { buildRiskResponse } from "@/lib/riskScore";
import type { TokenChainData, WalletChainData } from "@/lib/helius/index";
import type { EntityType, RiskResponse } from "@/lib/types";

export async function computeAndPersistRisk(
  address: string,
  type: EntityType,
  data: WalletChainData | TokenChainData
): Promise<RiskResponse> {
  const risk = buildRiskResponse(address, type, data);

  if (hasDatabase()) {
    const breakdown = risk.breakdown as unknown as Prisma.InputJsonValue;

    await withDbFallback(
      () =>
        prisma.riskScore.upsert({
          where: {
            targetType_targetAddress: {
              targetType: type,
              targetAddress: address,
            },
          },
          create: {
            targetType: type,
            targetAddress: address,
            score: risk.score,
            breakdown,
            calculatedAt: new Date(),
          },
          update: {
            score: risk.score,
            breakdown,
            calculatedAt: new Date(),
          },
        }),
      undefined,
      `risk persist (${type}:${address})`
    );
  }

  return risk;
}