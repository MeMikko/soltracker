import type { ClusterContext, ClusterGraph, ClusterNode } from "@/lib/clustering/types";

const NODE_WIDTH = { normal: 136, compact: 104 } as const;
const NODE_HEIGHT = { normal: 108, compact: 76 } as const;
const H_GAP = { normal: 28, compact: 14 } as const;
const V_GAP = { normal: 80, compact: 52 } as const;

function tierForNode(node: ClusterNode, context: ClusterContext): number {
  if (context === "token_creator") {
    switch (node.role) {
      case "funder":
        return 0;
      case "creator":
        return 1;
      case "mint":
        return 2;
      case "sibling":
        return 3;
      default:
        return 4;
    }
  }

  switch (node.role) {
    case "funder":
      return 0;
    case "seed":
    case "creator":
      return 1;
    case "recipient":
      return 2;
    default:
      return 3;
  }
}

export function layoutClusterNodes(
  graph: ClusterGraph,
  compact: boolean
): Array<{ id: string; x: number; y: number }> {
  const nodeWidth = compact ? NODE_WIDTH.compact : NODE_WIDTH.normal;
  const nodeHeight = compact ? NODE_HEIGHT.compact : NODE_HEIGHT.normal;
  const hGap = compact ? H_GAP.compact : H_GAP.normal;
  const vGap = compact ? V_GAP.compact : V_GAP.normal;
  const canvasWidth = compact ? 340 : 640;

  const tiers = new Map<number, ClusterNode[]>();
  for (const node of graph.nodes) {
    const tier = tierForNode(node, graph.meta.context);
    const bucket = tiers.get(tier) ?? [];
    bucket.push(node);
    tiers.set(tier, bucket);
  }

  const sortedTiers = [...tiers.keys()].sort((a, b) => a - b);
  const positions: Array<{ id: string; x: number; y: number }> = [];
  let y = compact ? 24 : 32;

  for (const tier of sortedTiers) {
    const nodesInTier = tiers.get(tier) ?? [];
    const rowWidth =
      nodesInTier.length * nodeWidth + Math.max(0, nodesInTier.length - 1) * hGap;
    let x = Math.max(compact ? 8 : 16, (canvasWidth - rowWidth) / 2);

    for (const node of nodesInTier) {
      positions.push({ id: node.id, x, y });
      x += nodeWidth + hGap;
    }

    y += nodeHeight + vGap;
  }

  return positions;
}

export function clusterCanvasHeight(
  graph: ClusterGraph,
  compact: boolean
): number {
  const tiers = new Set(
    graph.nodes.map((n) => tierForNode(n, graph.meta.context))
  );
  const nodeHeight = compact ? NODE_HEIGHT.compact : NODE_HEIGHT.normal;
  const vGap = compact ? V_GAP.compact : V_GAP.normal;
  return Math.max(
    compact ? 360 : 420,
    48 + tiers.size * (nodeHeight + vGap)
  );
}