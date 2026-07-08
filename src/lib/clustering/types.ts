export type ClusterEdgeType =
  | "shared_funding"
  | "temporal"
  | "shared_token"
  | "token_launch"
  | "coordinated_buy"
  | "rug_link";

export type ClusterNodeRole =
  | "seed"
  | "creator"
  | "mint"
  | "funder"
  | "sibling"
  | "recipient"
  | "peer";

export interface FunderAlert {
  funder: string;
  signals: string[];
}

export type ClusterContext = "wallet" | "token_creator";

export type ClusterRiskLevel = "low" | "medium" | "high";

export interface ClusterNode {
  id: string;
  address: string;
  label: string;
  role: ClusterNodeRole;
  riskLevel: ClusterRiskLevel;
  riskScore: number;
  solBalance?: number;
  txCount?: number;
  sharedTokens?: string[];
  flags?: string[];
}

export interface ClusterEdge {
  id: string;
  source: string;
  target: string;
  type: ClusterEdgeType;
  weight: number;
  label: string;
}

export interface ClusterGraph {
  seedAddress: string;
  nodes: ClusterNode[];
  edges: ClusterEdge[];
  meta: {
    computedAt: string;
    heuristicVersion: string;
    context: ClusterContext;
    signalCounts: Record<ClusterEdgeType, number>;
    mintAddress?: string;
    creatorAddress?: string;
    tokenSymbol?: string | null;
    tokenName?: string | null;
    coordinatedBuyers?: number;
    funderAlerts?: FunderAlert[];
  };
}

export interface SolTransfer {
  from: string;
  to: string;
  lamports: number;
  blockTime: number | null;
  signature: string;
}