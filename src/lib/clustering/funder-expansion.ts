import { fetchWalletTransfers } from "./transfers";
import { walletHoldsMint, fetchWalletMintIds } from "./holdings";
import { findPriorPumpDeploys } from "./pump-deploys";
import type {
  ClusterEdge,
  ClusterEdgeType,
  ClusterNode,
  ClusterNodeRole,
  SolTransfer,
} from "./types";

const MAX_FUNDERS = 3;
const MAX_SIBLINGS_PER_FUNDER = 4;
const MIN_SOL_LAMPORTS = 10_000_000;

export interface FunderAlert {
  funder: string;
  signals: string[];
}

export interface FunderExpansionResult {
  edges: ClusterEdge[];
  nodeFlags: Map<string, string[]>;
  funderAlerts: FunderAlert[];
  coordinatedBuyers: number;
  transferStats: Map<string, { inbound: number; outbound: number; tx: number }>;
}

function edgeId(source: string, target: string, type: ClusterEdgeType): string {
  return `${source}-${target}-${type}`;
}

function truncateLabel(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function extractFunders(
  creator: string,
  edges: ClusterEdge[]
): string[] {
  const funders = edges
    .filter(
      (e) =>
        e.type === "shared_funding" &&
        e.target === creator &&
        e.source !== creator
    )
    .sort((a, b) => b.weight - a.weight)
    .map((e) => e.source);

  return [...new Set(funders)].slice(0, MAX_FUNDERS);
}

function outboundFundedWallets(
  funder: string,
  transfers: SolTransfer[],
  exclude: Set<string>
): Array<{ wallet: string; lamports: number }> {
  const totals = new Map<string, number>();

  for (const transfer of transfers) {
    if (transfer.from !== funder) continue;
    if (transfer.lamports < MIN_SOL_LAMPORTS) continue;
    if (exclude.has(transfer.to)) continue;

    totals.set(transfer.to, (totals.get(transfer.to) ?? 0) + transfer.lamports);
  }

  return [...totals.entries()]
    .map(([wallet, lamports]) => ({ wallet, lamports }))
    .sort((a, b) => b.lamports - a.lamports)
    .slice(0, MAX_SIBLINGS_PER_FUNDER);
}

function bumpTransferStats(
  stats: Map<string, { inbound: number; outbound: number; tx: number }>,
  transfer: SolTransfer
): void {
  const bump = (address: string, field: "inbound" | "outbound") => {
    const current = stats.get(address) ?? { inbound: 0, outbound: 0, tx: 0 };
    current[field] += 1;
    current.tx += 1;
    stats.set(address, current);
  };
  bump(transfer.from, "outbound");
  bump(transfer.to, "inbound");
}

export async function expandCreatorFunderNetwork(
  creator: string,
  targetMint: string,
  targetSymbol: string | null,
  baseEdges: ClusterEdge[]
): Promise<FunderExpansionResult> {
  const funders = extractFunders(creator, baseEdges);
  const edges: ClusterEdge[] = [];
  const seenEdges = new Set<string>(baseEdges.map((e) => e.id));
  const nodeFlags = new Map<string, string[]>();
  const funderAlerts: FunderAlert[] = [];
  const transferStats = new Map<
    string,
    { inbound: number; outbound: number; tx: number }
  >();

  const exclude = new Set([creator, targetMint]);
  let coordinatedBuyers = 0;

  const addFlag = (address: string, flag: string) => {
    const current = nodeFlags.get(address) ?? [];
    if (!current.includes(flag)) {
      nodeFlags.set(address, [...current, flag]);
    }
  };

  for (const funder of funders) {
    const transfers = await fetchWalletTransfers(funder);
    for (const transfer of transfers) {
      bumpTransferStats(transferStats, transfer);
    }

    const siblings = outboundFundedWallets(funder, transfers, exclude);
    const funderSignals: string[] = [];
    let funderCoordinatedCount = 0;
    let priorRugDeploys = 0;

    for (const { wallet: sibling, lamports } of siblings) {
      exclude.add(sibling);

      const fundingKey = edgeId(funder, sibling, "shared_funding");
      if (!seenEdges.has(fundingKey)) {
        seenEdges.add(fundingKey);
        edges.push({
          id: fundingKey,
          source: funder,
          target: sibling,
          type: "shared_funding",
          weight: Math.min(2.5, lamports / 500_000_000),
          label: `Funded ${(lamports / 1e9).toFixed(2)} SOL`,
        });
      }

      const holdsTarget = await walletHoldsMint(sibling, targetMint);
      if (holdsTarget) {
        coordinatedBuyers += 1;
        funderCoordinatedCount += 1;

        const buyKey = edgeId(sibling, targetMint, "coordinated_buy");
        if (!seenEdges.has(buyKey)) {
          seenEdges.add(buyKey);
          edges.push({
            id: buyKey,
            source: sibling,
            target: targetMint,
            type: "coordinated_buy",
            weight: 2.2,
            label: `Holds ${targetSymbol ?? "target token"}`,
          });
        }

        addFlag(sibling, "Holds target token");
        addFlag(funder, "Coordinated funding");
      }

      const priorDeploys = await findPriorPumpDeploys(sibling, targetMint);
      const riskyDeploys = priorDeploys.filter((d) => d.mintAuthorityActive);

      if (riskyDeploys.length > 0) {
        priorRugDeploys += riskyDeploys.length;

        const rugKey = edgeId(funder, sibling, "rug_link");
        if (!seenEdges.has(rugKey)) {
          seenEdges.add(rugKey);
          edges.push({
            id: rugKey,
            source: funder,
            target: sibling,
            type: "rug_link",
            weight: 1.8 + riskyDeploys.length * 0.3,
            label: `Prior deploy${riskyDeploys.length > 1 ? "s" : ""} (${riskyDeploys.length})`,
          });
        }

        addFlag(sibling, `${riskyDeploys.length} prior risky deploy`);
        addFlag(funder, "Funded prior deployer");
      }

      const holdings = await fetchWalletMintIds(sibling);
      if (holdings.length >= 8) {
        addFlag(sibling, "Heavy pump exposure");
      }
    }

    if (funderCoordinatedCount >= 2) {
      funderSignals.push(
        `Funded ${funderCoordinatedCount} wallets holding this token`
      );
    }
    if (priorRugDeploys > 0) {
      funderSignals.push(
        `Linked to ${priorRugDeploys} prior risky pump deploy${priorRugDeploys > 1 ? "s" : ""}`
      );
    }
    if (siblings.length >= 3) {
      funderSignals.push(`Funded ${siblings.length} sibling wallets`);
    }

    if (funderSignals.length > 0) {
      funderAlerts.push({ funder, signals: funderSignals });
    }
  }

  return {
    edges,
    nodeFlags,
    funderAlerts,
    coordinatedBuyers,
    transferStats,
  };
}

export function resolveNodeRole(
  address: string,
  creator: string,
  targetMint: string,
  edges: ClusterEdge[],
  flags: Map<string, string[]>
): ClusterNodeRole {
  if (address === creator) return "creator";
  if (address === targetMint) return "mint";

  if (
    edges.some(
      (e) =>
        e.type === "shared_funding" &&
        e.target === creator &&
        e.source === address
    )
  ) {
    return "funder";
  }

  if (
    edges.some(
      (e) =>
        e.type === "shared_funding" &&
        e.source !== creator &&
        (e.target === address || e.source === address) &&
        (flags.get(e.source)?.includes("Coordinated funding") ||
          edges.some(
            (inner) =>
              inner.type === "rug_link" &&
              inner.source === e.source &&
              inner.target === address
          ))
    ) &&
    address !== creator
  ) {
    const isSibling = edges.some(
      (e) =>
        e.type === "shared_funding" &&
        e.target === address &&
        e.source !== creator &&
        e.target !== creator
    );
    if (isSibling) return "sibling";
  }

  if (
    edges.some(
      (e) =>
        e.type === "shared_funding" &&
        e.target === address &&
        e.source !== creator
    )
  ) {
    return "sibling";
  }

  if (
    edges.some(
      (e) => e.type === "shared_funding" && e.source === address
    )
  ) {
    return "funder";
  }

  return "peer";
}

export function buildExpandedNode(
  address: string,
  creator: string,
  targetMint: string,
  edges: ClusterEdge[],
  flags: Map<string, string[]>,
  tokenMap: Map<string, string[]>,
  transferStats: Map<string, { inbound: number; outbound: number; tx: number }>
): ClusterNode {
  const role = resolveNodeRole(address, creator, targetMint, edges, flags);
  const stats = transferStats.get(address) ?? { inbound: 0, outbound: 0, tx: 0 };
  const nodeFlags = flags.get(address) ?? [];

  let riskScore = 62;
  if (role === "creator") riskScore = 58;
  if (role === "funder") riskScore = 48;
  if (role === "sibling") riskScore = 42;
  if (nodeFlags.includes("Holds target token")) riskScore -= 8;
  if (nodeFlags.some((f) => f.includes("prior risky deploy"))) riskScore -= 15;
  if (nodeFlags.includes("Coordinated funding")) riskScore -= 12;
  if (stats.tx < 5) riskScore -= 10;

  riskScore = Math.max(10, Math.min(95, riskScore));

  const riskLevel =
    riskScore >= 70 ? "low" : riskScore >= 45 ? "medium" : "high";

  let label = truncateLabel(address);
  if (address === creator) label = "Token creator";
  if (address === targetMint) label = "Target token";
  if (role === "sibling" && nodeFlags.includes("Holds target token")) {
    label = `Buyer ${truncateLabel(address)}`;
  }

  return {
    id: address,
    address,
    label,
    role,
    riskLevel,
    riskScore,
    sharedTokens: tokenMap.get(address),
    flags: nodeFlags.length > 0 ? nodeFlags : undefined,
  };
}