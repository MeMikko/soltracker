export type ClusterEdgeType = "shared_funding" | "temporal" | "shared_token";

export type ClusterNodeRole = "seed" | "funder" | "recipient" | "peer";

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
    signalCounts: Record<ClusterEdgeType, number>;
  };
}

export interface SolTransfer {
  from: string;
  to: string;
  lamports: number;
  blockTime: number | null;
  signature: string;
}