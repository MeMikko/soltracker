import { findPriorPumpDeploys } from "@/lib/clustering/pump-deploys";
import { heliusRpc } from "@/lib/helius/client";
import type { RiskLevel } from "@/lib/types";

export interface PriorDeployEntry {
  mint: string;
  symbol: string | null;
  name: string | null;
  mintAuthorityActive: boolean;
}

export interface DeployerReputation {
  wallet: string;
  totalPriorDeploys: number;
  priorDeploys: PriorDeployEntry[];
  activeMintAuthorityCount: number;
  revokedMintAuthorityCount: number;
  score: number;
  level: RiskLevel;
  signals: string[];
}

interface HeliusAssetBrief {
  id: string;
  content?: {
    metadata?: { name?: string; symbol?: string };
  };
  token_info?: { symbol?: string };
}

async function enrichDeployMetadata(
  deploys: Array<{ mint: string; mintAuthorityActive: boolean }>
): Promise<PriorDeployEntry[]> {
  return Promise.all(
    deploys.map(async (deploy) => {
      try {
        const asset = await heliusRpc<HeliusAssetBrief>("getAsset", {
          id: deploy.mint,
        });
        return {
          mint: deploy.mint,
          mintAuthorityActive: deploy.mintAuthorityActive,
          name: asset.content?.metadata?.name ?? null,
          symbol:
            asset.content?.metadata?.symbol ??
            asset.token_info?.symbol ??
            null,
        };
      } catch {
        return {
          mint: deploy.mint,
          mintAuthorityActive: deploy.mintAuthorityActive,
          name: null,
          symbol: null,
        };
      }
    })
  );
}

function scoreDeployer(input: {
  totalPriorDeploys: number;
  activeMintAuthorityCount: number;
  revokedMintAuthorityCount: number;
}): { score: number; level: RiskLevel; signals: string[] } {
  const signals: string[] = [];
  let score = 82;

  if (input.totalPriorDeploys === 0) {
    signals.push("No prior token deploys found for this creator");
    return { score: 80, level: "low", signals };
  }

  signals.push(
    `${input.totalPriorDeploys} prior token${input.totalPriorDeploys === 1 ? "" : "s"} from this wallet`
  );

  score -= Math.min(24, input.totalPriorDeploys * 6);

  if (input.activeMintAuthorityCount > 0) {
    score -= input.activeMintAuthorityCount * 10;
    signals.push(
      `${input.activeMintAuthorityCount} prior mint${input.activeMintAuthorityCount === 1 ? "" : "s"} still have active mint authority`
    );
  }

  if (input.revokedMintAuthorityCount > 0) {
    score += Math.min(8, input.revokedMintAuthorityCount * 2);
    signals.push(
      `${input.revokedMintAuthorityCount} prior mint${input.revokedMintAuthorityCount === 1 ? "" : "s"} revoked mint authority`
    );
  }

  if (input.totalPriorDeploys >= 5) {
    score -= 12;
    signals.push("Serial deployer — launched 5+ tokens");
  } else if (input.totalPriorDeploys >= 3) {
    score -= 6;
    signals.push("Repeat launcher — multiple prior tokens");
  }

  if (
    input.activeMintAuthorityCount >= 2 &&
    input.totalPriorDeploys >= 2
  ) {
    signals.push("Rug pattern risk — multiple deploys with live mint authority");
  }

  score = Math.max(0, Math.min(100, score));

  let level: RiskLevel = "low";
  if (score < 45) level = "high";
  else if (score < 68) level = "medium";

  return { score, level, signals };
}

export async function buildDeployerReputation(
  creatorWallet: string | null,
  currentMint: string
): Promise<DeployerReputation | null> {
  if (!creatorWallet) return null;

  const rawDeploys = await findPriorPumpDeploys(creatorWallet, currentMint);
  const priorDeploys = await enrichDeployMetadata(rawDeploys);

  const activeMintAuthorityCount = priorDeploys.filter(
    (deploy) => deploy.mintAuthorityActive
  ).length;
  const revokedMintAuthorityCount = priorDeploys.filter(
    (deploy) => !deploy.mintAuthorityActive
  ).length;

  const { score, level, signals } = scoreDeployer({
    totalPriorDeploys: priorDeploys.length,
    activeMintAuthorityCount,
    revokedMintAuthorityCount,
  });

  return {
    wallet: creatorWallet,
    totalPriorDeploys: priorDeploys.length,
    priorDeploys,
    activeMintAuthorityCount,
    revokedMintAuthorityCount,
    score,
    level,
    signals,
  };
}

export function mockDeployerReputation(
  creator: string,
  mint: string
): DeployerReputation {
  const seed = mint.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  const total = seed % 4;
  const active = seed % 3 === 0 ? 1 : 0;

  const priorDeploys: PriorDeployEntry[] = Array.from({ length: total }, (_, i) => ({
    mint: `Prior${mint.slice(0, 6)}${i}`,
    symbol: `P${i}`,
    name: `Prior Token ${i + 1}`,
    mintAuthorityActive: i === 0 && active === 1,
  }));

  const { score, level, signals } = scoreDeployer({
    totalPriorDeploys: total,
    activeMintAuthorityCount: priorDeploys.filter((d) => d.mintAuthorityActive)
      .length,
    revokedMintAuthorityCount: priorDeploys.filter((d) => !d.mintAuthorityActive)
      .length,
  });

  return {
    wallet: creator,
    totalPriorDeploys: total,
    priorDeploys,
    activeMintAuthorityCount: priorDeploys.filter((d) => d.mintAuthorityActive)
      .length,
    revokedMintAuthorityCount: priorDeploys.filter((d) => !d.mintAuthorityActive)
      .length,
    score,
    level,
    signals,
  };
}