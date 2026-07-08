import { HeliusError } from "@/lib/helius/errors";
import { hasHeliusApiKey } from "@/lib/helius/client";
import {
  buildExpandedNode,
  expandCreatorFunderNetwork,
} from "./clustering/funder-expansion";
import { fetchWalletTransfers } from "./clustering/transfers";
import type {
  ClusterEdge,
  ClusterEdgeType,
  ClusterGraph,
  ClusterNode,
  ClusterNodeRole,
  ClusterRiskLevel,
  SolTransfer,
} from "./clustering/types";

export const CLUSTER_HEURISTIC_VERSION = "zen-v2";
const TEMPORAL_WINDOW_SEC = 3600;
const MIN_SOL_LAMPORTS = 10_000_000; // 0.01 SOL

interface FungibleAsset {
  id: string;
  token_info?: { symbol?: string };
  content?: { metadata?: { symbol?: string } };
}

interface AssetsResult {
  items: FungibleAsset[];
}

function truncateLabel(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function scoreToRisk(score: number): ClusterRiskLevel {
  if (score >= 70) return "low";
  if (score >= 45) return "medium";
  return "high";
}

function estimateNodeRisk(
  role: ClusterNodeRole,
  txCount: number,
  inboundSol: number
): number {
  let score = 62;

  if (role === "seed" || role === "creator") score = 58;
  if (role === "funder" && inboundSol === 0) score -= 12;
  if (txCount < 5) score -= 18;
  if (txCount > 200) score += 8;

  return Math.max(10, Math.min(95, score));
}

function edgeId(source: string, target: string, type: ClusterEdgeType): string {
  return `${source}-${target}-${type}`;
}

function buildFundingEdges(
  seed: string,
  transfers: SolTransfer[]
): ClusterEdge[] {
  const edges: ClusterEdge[] = [];
  const seen = new Set<string>();

  for (const transfer of transfers) {
    if (transfer.lamports < MIN_SOL_LAMPORTS) continue;

    if (transfer.to === seed && transfer.from !== seed) {
      const key = edgeId(transfer.from, seed, "shared_funding");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        id: key,
        source: transfer.from,
        target: seed,
        type: "shared_funding",
        weight: Math.min(3, transfer.lamports / 500_000_000),
        label: `Funded ${(transfer.lamports / 1e9).toFixed(2)} SOL`,
      });
    }

    if (transfer.from === seed && transfer.to !== seed) {
      const key = edgeId(seed, transfer.to, "shared_funding");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        id: key,
        source: seed,
        target: transfer.to,
        type: "shared_funding",
        weight: Math.min(3, transfer.lamports / 500_000_000),
        label: `Sent ${(transfer.lamports / 1e9).toFixed(2)} SOL`,
      });
    }
  }

  return edges;
}

function buildTemporalEdges(
  seed: string,
  transfers: SolTransfer[],
  peerAddresses: Set<string>
): ClusterEdge[] {
  const seedTimes = transfers
    .filter((t) => t.from === seed || t.to === seed)
    .map((t) => t.blockTime)
    .filter((t): t is number => t !== null);

  if (seedTimes.length === 0) return [];

  const edges: ClusterEdge[] = [];

  for (const peer of peerAddresses) {
    const peerTimes = transfers
      .filter((t) => t.from === peer || t.to === peer)
      .map((t) => t.blockTime)
      .filter((t): t is number => t !== null);

    for (const seedTime of seedTimes) {
      const overlap = peerTimes.some(
        (peerTime) => Math.abs(peerTime - seedTime) <= TEMPORAL_WINDOW_SEC
      );
      if (overlap) {
        edges.push({
          id: edgeId(seed, peer, "temporal"),
          source: seed,
          target: peer,
          type: "temporal",
          weight: 1.2,
          label: "Active within 1h window",
        });
        break;
      }
    }
  }

  return edges;
}

async function fetchTokenSymbols(address: string): Promise<string[]> {
  const { heliusRpc } = await import("@/lib/helius/client");
  const result = await heliusRpc<AssetsResult>("getAssetsByOwner", {
    ownerAddress: address,
    page: 1,
    limit: 12,
    options: { showFungible: true },
  });

  return (result.items ?? [])
    .map(
      (item) =>
        item.token_info?.symbol ??
        item.content?.metadata?.symbol ??
        truncateLabel(item.id)
    )
    .filter(Boolean)
    .slice(0, 6);
}

async function buildSharedTokenEdges(
  seed: string,
  peers: string[]
): Promise<{ edges: ClusterEdge[]; tokenMap: Map<string, string[]> }> {
  const seedTokens = await fetchTokenSymbols(seed);
  const tokenMap = new Map<string, string[]>([[seed, seedTokens]]);
  const edges: ClusterEdge[] = [];

  for (const peer of peers) {
    const peerTokens = await fetchTokenSymbols(peer);
    tokenMap.set(peer, peerTokens);

    const shared = seedTokens.filter((symbol) => peerTokens.includes(symbol));
    if (shared.length > 0) {
      edges.push({
        id: edgeId(seed, peer, "shared_token"),
        source: seed,
        target: peer,
        type: "shared_token",
        weight: Math.min(2.5, shared.length * 0.8),
        label: `Shared: ${shared.slice(0, 2).join(", ")}`,
      });
    }
  }

  return { edges, tokenMap };
}

function buildNodes(
  seed: string,
  edges: ClusterEdge[],
  tokenMap: Map<string, string[]>,
  transferStats: Map<string, { inbound: number; outbound: number; tx: number }>
): ClusterNode[] {
  const addresses = new Set<string>([seed]);

  for (const edge of edges) {
    addresses.add(edge.source);
    addresses.add(edge.target);
  }

  return [...addresses].map((address) => {
    const role: ClusterNodeRole =
      address === seed
        ? "seed"
        : edges.some((e) => e.target === address && e.type === "shared_funding")
          ? "recipient"
          : edges.some(
                (e) => e.source === address && e.type === "shared_funding"
              )
            ? "funder"
            : "peer";

    const stats = transferStats.get(address) ?? {
      inbound: 0,
      outbound: 0,
      tx: 0,
    };
    const riskScore = estimateNodeRisk(role, stats.tx, stats.inbound);

    return {
      id: address,
      address,
      label: address === seed ? "Seed wallet" : truncateLabel(address),
      role,
      riskLevel: scoreToRisk(riskScore),
      riskScore,
      sharedTokens: tokenMap.get(address),
    };
  });
}

function buildTransferStats(transfers: SolTransfer[]): Map<
  string,
  { inbound: number; outbound: number; tx: number }
> {
  const stats = new Map<
    string,
    { inbound: number; outbound: number; tx: number }
  >();

  const bump = (address: string, field: "inbound" | "outbound") => {
    const current = stats.get(address) ?? { inbound: 0, outbound: 0, tx: 0 };
    current[field] += 1;
    current.tx += 1;
    stats.set(address, current);
  };

  for (const transfer of transfers) {
    bump(transfer.from, "outbound");
    bump(transfer.to, "inbound");
  }

  return stats;
}

function mockCluster(seedAddress: string): ClusterGraph {
  const peers = Array.from({ length: 5 }, (_, i) => {
    const suffix = (i + 1).toString().padStart(2, "0");
    return `${seedAddress.slice(0, 32)}${suffix}`.slice(0, 44);
  });

  const edges: ClusterEdge[] = [
    {
      id: edgeId(peers[0], seedAddress, "shared_funding"),
      source: peers[0],
      target: seedAddress,
      type: "shared_funding",
      weight: 2.1,
      label: "Funded 1.20 SOL",
    },
    {
      id: edgeId(seedAddress, peers[1], "shared_funding"),
      source: seedAddress,
      target: peers[1],
      type: "shared_funding",
      weight: 1.4,
      label: "Sent 0.45 SOL",
    },
    {
      id: edgeId(seedAddress, peers[2], "temporal"),
      source: seedAddress,
      target: peers[2],
      type: "temporal",
      weight: 1.2,
      label: "Active within 1h window",
    },
    {
      id: edgeId(seedAddress, peers[3], "shared_token"),
      source: seedAddress,
      target: peers[3],
      type: "shared_token",
      weight: 1.6,
      label: "Shared: BONK, WIF",
    },
  ];

  const nodes: ClusterNode[] = [seedAddress, ...peers].map((address, index) => {
    const role: ClusterNodeRole =
      index === 0
        ? "seed"
        : index === 1
          ? "funder"
          : index === 2
            ? "recipient"
            : "peer";
    const riskScore = index === 0 ? 58 : 40 + index * 7;

    return {
      id: address,
      address,
      label: index === 0 ? "Seed wallet" : truncateLabel(address),
      role,
      riskLevel: scoreToRisk(riskScore),
      riskScore,
      sharedTokens: index > 2 ? ["BONK", "WIF"] : undefined,
    };
  });

  return {
    seedAddress,
    nodes,
    edges,
    meta: {
      computedAt: new Date().toISOString(),
      heuristicVersion: CLUSTER_HEURISTIC_VERSION,
      context: "wallet",
      signalCounts: {
        shared_funding: 2,
        temporal: 1,
        shared_token: 1,
        token_launch: 0,
        coordinated_buy: 0,
        rug_link: 0,
      },
    },
  };
}

function emptySignalCounts(): Record<
  import("./clustering/types").ClusterEdgeType,
  number
> {
  return {
    shared_funding: 0,
    temporal: 0,
    shared_token: 0,
    token_launch: 0,
    coordinated_buy: 0,
    rug_link: 0,
  };
}

function mockTokenCreatorCluster(
  input: TokenCreatorClusterInput
): ClusterGraph {
  const { mintAddress, creatorWallet, symbol, name } = input;
  if (!creatorWallet) {
    throw new HeliusError(
      "Token creator could not be identified for clustering",
      "NOT_FOUND"
    );
  }

  const funder1 = `${creatorWallet.slice(0, 30)}f1`.padEnd(44, "1").slice(0, 44);
  const funder2 = `${creatorWallet.slice(0, 30)}f2`.padEnd(44, "2").slice(0, 44);
  const sibling1 = `${creatorWallet.slice(0, 30)}s1`.padEnd(44, "3").slice(0, 44);
  const sibling2 = `${creatorWallet.slice(0, 30)}s2`.padEnd(44, "4").slice(0, 44);
  const tokenLabel = symbol ?? name ?? truncateLabel(mintAddress);

  const edges: ClusterEdge[] = [
    {
      id: edgeId(funder1, creatorWallet, "shared_funding"),
      source: funder1,
      target: creatorWallet,
      type: "shared_funding",
      weight: 2.2,
      label: "Funded 1.50 SOL",
    },
    {
      id: edgeId(funder1, sibling1, "shared_funding"),
      source: funder1,
      target: sibling1,
      type: "shared_funding",
      weight: 1.8,
      label: "Funded 0.80 SOL",
    },
    {
      id: edgeId(funder1, sibling2, "shared_funding"),
      source: funder1,
      target: sibling2,
      type: "shared_funding",
      weight: 1.6,
      label: "Funded 0.65 SOL",
    },
    {
      id: edgeId(sibling1, mintAddress, "coordinated_buy"),
      source: sibling1,
      target: mintAddress,
      type: "coordinated_buy",
      weight: 2.2,
      label: `Holds ${tokenLabel}`,
    },
    {
      id: edgeId(sibling2, mintAddress, "coordinated_buy"),
      source: sibling2,
      target: mintAddress,
      type: "coordinated_buy",
      weight: 2.2,
      label: `Holds ${tokenLabel}`,
    },
    {
      id: edgeId(funder1, sibling2, "rug_link"),
      source: funder1,
      target: sibling2,
      type: "rug_link",
      weight: 2.1,
      label: "Prior deploy (1)",
    },
    {
      id: edgeId(creatorWallet, mintAddress, "token_launch"),
      source: creatorWallet,
      target: mintAddress,
      type: "token_launch",
      weight: 2.5,
      label: "Deployed token",
    },
  ];

  const nodes: ClusterNode[] = [
    {
      id: creatorWallet,
      address: creatorWallet,
      label: "Token creator",
      role: "creator",
      riskLevel: "medium",
      riskScore: 58,
    },
    {
      id: mintAddress,
      address: mintAddress,
      label: tokenLabel,
      role: "mint",
      riskLevel: "medium",
      riskScore: 52,
      sharedTokens: symbol ? [symbol] : undefined,
    },
    {
      id: funder1,
      address: funder1,
      label: truncateLabel(funder1),
      role: "funder",
      riskLevel: "high",
      riskScore: 32,
      flags: ["Coordinated funding", "Funded prior deployer"],
    },
    {
      id: sibling1,
      address: sibling1,
      label: `Buyer ${truncateLabel(sibling1)}`,
      role: "sibling",
      riskLevel: "high",
      riskScore: 34,
      flags: ["Holds target token"],
    },
    {
      id: sibling2,
      address: sibling2,
      label: `Buyer ${truncateLabel(sibling2)}`,
      role: "sibling",
      riskLevel: "high",
      riskScore: 28,
      flags: ["Holds target token", "1 prior risky deploy"],
    },
  ];

  const signalCounts = emptySignalCounts();
  for (const edge of edges) signalCounts[edge.type] += 1;

  return {
    seedAddress: creatorWallet,
    nodes,
    edges,
    meta: {
      computedAt: new Date().toISOString(),
      heuristicVersion: CLUSTER_HEURISTIC_VERSION,
      context: "token_creator",
      signalCounts,
      mintAddress,
      creatorAddress: creatorWallet,
      tokenSymbol: symbol,
      tokenName: name,
      coordinatedBuyers: 2,
      funderAlerts: [
        {
          funder: funder1,
          signals: [
            "Funded 2 wallets holding this token",
            "Linked to 1 prior risky pump deploy",
          ],
        },
      ],
    },
  };
}

export interface TokenCreatorClusterInput {
  mintAddress: string;
  creatorWallet: string | null;
  symbol: string | null;
  name: string | null;
}

export async function buildTokenCreatorCluster(
  input: TokenCreatorClusterInput
): Promise<ClusterGraph> {
  const { mintAddress, creatorWallet, symbol, name } = input;

  if (!creatorWallet) {
    throw new HeliusError(
      "Token creator could not be identified for clustering",
      "NOT_FOUND"
    );
  }

  if (!hasHeliusApiKey()) {
    return mockTokenCreatorCluster(input);
  }

  const base = await buildWalletCluster(creatorWallet);
  const tokenLabel = symbol ?? name ?? truncateLabel(mintAddress);

  const launchEdge: ClusterEdge = {
    id: edgeId(creatorWallet, mintAddress, "token_launch"),
    source: creatorWallet,
    target: mintAddress,
    type: "token_launch",
    weight: 2.5,
    label: "Deployed token",
  };

  let edges = [...base.edges, launchEdge];

  const expansion = await expandCreatorFunderNetwork(
    creatorWallet,
    mintAddress,
    symbol ?? name,
    edges
  );
  edges = [...edges, ...expansion.edges];

  const addresses = new Set<string>([creatorWallet, mintAddress]);
  for (const edge of edges) {
    addresses.add(edge.source);
    addresses.add(edge.target);
  }

  const tokenMap = new Map<string, string[]>();
  for (const node of base.nodes) {
    if (node.sharedTokens?.length) {
      tokenMap.set(node.address, node.sharedTokens);
    }
  }
  if (symbol) {
    for (const [address, flags] of expansion.nodeFlags) {
      if (flags.includes("Holds target token")) {
        tokenMap.set(address, [symbol]);
      }
    }
  }

  const nodes = [...addresses].map((address) => {
    const built = buildExpandedNode(
      address,
      creatorWallet,
      mintAddress,
      edges,
      expansion.nodeFlags,
      tokenMap,
      expansion.transferStats
    );

    if (address === mintAddress) {
      return {
        ...built,
        label: tokenLabel,
        role: "mint" as const,
        riskLevel: "medium" as const,
        riskScore: 52,
        sharedTokens: symbol ? [symbol] : built.sharedTokens,
      };
    }

    if (address === creatorWallet) {
      return {
        ...built,
        label: "Token creator",
        role: "creator" as const,
      };
    }

    return built;
  });

  const signalCounts = emptySignalCounts();
  for (const edge of edges) {
    signalCounts[edge.type] += 1;
  }

  return {
    seedAddress: creatorWallet,
    nodes,
    edges,
    meta: {
      computedAt: new Date().toISOString(),
      heuristicVersion: CLUSTER_HEURISTIC_VERSION,
      context: "token_creator",
      signalCounts,
      mintAddress,
      creatorAddress: creatorWallet,
      tokenSymbol: symbol,
      tokenName: name,
      coordinatedBuyers: expansion.coordinatedBuyers,
      funderAlerts: expansion.funderAlerts,
    },
  };
}

export async function buildWalletCluster(
  seedAddress: string
): Promise<ClusterGraph> {
  if (!hasHeliusApiKey()) {
    return mockCluster(seedAddress);
  }

  const transfers = await fetchWalletTransfers(seedAddress);
  const fundingEdges = buildFundingEdges(seedAddress, transfers);

  const peerAddresses = new Set<string>();
  for (const edge of fundingEdges) {
    if (edge.source !== seedAddress) peerAddresses.add(edge.source);
    if (edge.target !== seedAddress) peerAddresses.add(edge.target);
  }

  const temporalEdges = buildTemporalEdges(
    seedAddress,
    transfers,
    peerAddresses
  );

  const peers = [...peerAddresses].slice(0, 4);
  const { edges: tokenEdges, tokenMap } = await buildSharedTokenEdges(
    seedAddress,
    peers
  );

  const edges = [...fundingEdges, ...temporalEdges, ...tokenEdges];
  const transferStats = buildTransferStats(transfers);
  const nodes = buildNodes(seedAddress, edges, tokenMap, transferStats);

  const signalCounts = emptySignalCounts();
  for (const edge of edges) {
    signalCounts[edge.type] += 1;
  }

  return {
    seedAddress,
    nodes,
    edges,
    meta: {
      computedAt: new Date().toISOString(),
      heuristicVersion: CLUSTER_HEURISTIC_VERSION,
      context: "wallet",
      signalCounts,
    },
  };
}