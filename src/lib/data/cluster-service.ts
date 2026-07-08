import { getCachedOrFetch, DEFAULT_CACHE_TTL_SECONDS } from "@/lib/cache";
import { hasDatabase } from "@/lib/config";
import {
  buildTokenCreatorCluster,
  buildWalletCluster,
  type TokenCreatorClusterInput,
} from "@/lib/clustering";
import type {
  ClusterGraph,
  ClusterNode,
  ClusterEdge,
  FunderAlert,
} from "@/lib/clustering/types";
import { CLUSTER_HEURISTIC_VERSION } from "@/lib/clustering";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import type { Prisma } from "@prisma/client";

const CLUSTER_CACHE_PREFIX = "cluster:v2:";
const TOKEN_CLUSTER_CACHE_PREFIX = "cluster:v2:token:";

function walletClusterCacheKey(address: string): string {
  return `${CLUSTER_CACHE_PREFIX}${address}`;
}

function tokenClusterCacheKey(mintAddress: string): string {
  return `${TOKEN_CLUSTER_CACHE_PREFIX}${mintAddress}`;
}

function clusterStorageKey(graph: ClusterGraph): string {
  if (graph.meta.context === "token_creator" && graph.meta.mintAddress) {
    return `token:${graph.meta.mintAddress}`;
  }
  return graph.seedAddress;
}

async function persistCluster(graph: ClusterGraph): Promise<void> {
  if (!hasDatabase()) return;

  const storageKey = clusterStorageKey(graph);
  const expiresAt = new Date(
    Date.now() + DEFAULT_CACHE_TTL_SECONDS * 1000
  );

  await withDbFallback(
    async () => {
      const existing = await prisma.walletCluster.findUnique({
        where: { seedAddress: storageKey },
        select: { id: true },
      });

      if (existing) {
        await prisma.clusterEdge.deleteMany({
          where: { clusterId: existing.id },
        });
        await prisma.walletCluster.update({
          where: { id: existing.id },
          data: {
            nodes: graph.nodes as unknown as Prisma.InputJsonValue,
            nodeCount: graph.nodes.length,
            edgeCount: graph.edges.length,
            calculatedAt: new Date(graph.meta.computedAt),
            expiresAt,
            edges: {
              create: graph.edges.map((edge) => ({
                source: edge.source,
                target: edge.target,
                edgeType: edge.type,
                weight: edge.weight,
                label: edge.label,
              })),
            },
          },
        });
        return;
      }

      await prisma.walletCluster.create({
        data: {
          seedAddress: storageKey,
          nodes: graph.nodes as unknown as Prisma.InputJsonValue,
          nodeCount: graph.nodes.length,
          edgeCount: graph.edges.length,
          calculatedAt: new Date(graph.meta.computedAt),
          expiresAt,
          edges: {
            create: graph.edges.map((edge) => ({
              source: edge.source,
              target: edge.target,
              edgeType: edge.type,
              weight: edge.weight,
              label: edge.label,
            })),
          },
        },
      });
    },
    undefined,
    `cluster persist (${storageKey})`
  );
}

function deriveTokenClusterMeta(
  nodes: ClusterNode[],
  edges: ClusterEdge[],
  mintAddress?: string
): Pick<
  ClusterGraph["meta"],
  "coordinatedBuyers" | "funderAlerts"
> {
  const coordinatedBuyers = edges.filter(
    (e) => e.type === "coordinated_buy"
  ).length;

  const funderAlerts: FunderAlert[] = [];
  const funders = nodes.filter((n) => n.role === "funder");

  for (const funder of funders) {
    const signals: string[] = [];
    const siblingTargets = edges
      .filter(
        (e) =>
          e.type === "shared_funding" &&
          e.source === funder.address &&
          e.target !== mintAddress
      )
      .map((e) => e.target);

    const coordinatedCount = edges.filter(
      (e) =>
        e.type === "coordinated_buy" &&
        siblingTargets.includes(e.source)
    ).length;

    const rugCount = edges.filter(
      (e) => e.type === "rug_link" && e.source === funder.address
    ).length;

    if (coordinatedCount >= 2) {
      signals.push(
        `Funded ${coordinatedCount} wallets holding this token`
      );
    }
    if (rugCount > 0) {
      const priorDeploys = edges
        .filter(
          (e) => e.type === "rug_link" && e.source === funder.address
        )
        .reduce((sum, e) => {
          const match = e.label.match(/\((\d+)\)/);
          return sum + (match ? Number(match[1]) : 1);
        }, 0);
      signals.push(
        `Linked to ${priorDeploys} prior risky pump deploy${priorDeploys > 1 ? "s" : ""}`
      );
    }
    if (siblingTargets.length >= 3) {
      signals.push(`Funded ${siblingTargets.length} sibling wallets`);
    }

    if (signals.length > 0) {
      funderAlerts.push({ funder: funder.address, signals });
    }
  }

  return {
    coordinatedBuyers: coordinatedBuyers > 0 ? coordinatedBuyers : undefined,
    funderAlerts: funderAlerts.length > 0 ? funderAlerts : undefined,
  };
}

function mapRowToGraph(
  row: {
    seedAddress: string;
    nodes: unknown;
    calculatedAt: Date;
    edges: Array<{
      source: string;
      target: string;
      edgeType: string;
      weight: number;
      label: string | null;
    }>;
  },
  nodes: ClusterNode[]
): ClusterGraph {
  const edges: ClusterEdge[] = row.edges.map((edge) => ({
    id: `${edge.source}-${edge.target}-${edge.edgeType}`,
    source: edge.source,
    target: edge.target,
    type: edge.edgeType as ClusterEdge["type"],
    weight: edge.weight,
    label: edge.label ?? "",
  }));

  const isTokenCluster = row.seedAddress.startsWith("token:");
  const mintAddress = isTokenCluster
    ? row.seedAddress.replace(/^token:/, "")
    : undefined;

  const creatorNode = nodes.find(
    (n) => n.role === "creator" || (isTokenCluster && n.role === "seed")
  );

  const signalCounts = {
    shared_funding: edges.filter((e) => e.type === "shared_funding").length,
    temporal: edges.filter((e) => e.type === "temporal").length,
    shared_token: edges.filter((e) => e.type === "shared_token").length,
    token_launch: edges.filter((e) => e.type === "token_launch").length,
    coordinated_buy: edges.filter((e) => e.type === "coordinated_buy").length,
    rug_link: edges.filter((e) => e.type === "rug_link").length,
  };

  const tokenMeta = isTokenCluster
    ? deriveTokenClusterMeta(nodes, edges, mintAddress)
    : {};

  return {
    seedAddress: creatorNode?.address ?? nodes[0]?.address ?? row.seedAddress,
    nodes,
    edges,
    meta: {
      computedAt: row.calculatedAt.toISOString(),
      heuristicVersion: CLUSTER_HEURISTIC_VERSION,
      context: isTokenCluster ? "token_creator" : "wallet",
      signalCounts,
      mintAddress,
      creatorAddress: creatorNode?.address,
      tokenSymbol: nodes.find((n) => n.role === "mint")?.label ?? null,
      ...tokenMeta,
    },
  };
}

async function readClusterFromDb(
  storageKey: string
): Promise<ClusterGraph | null> {
  if (!hasDatabase()) return null;

  return withDbFallback(
    async () => {
      const row = await prisma.walletCluster.findUnique({
        where: { seedAddress: storageKey },
        include: { edges: true },
      });

      if (!row || row.expiresAt <= new Date()) {
        return null;
      }

      const nodes = row.nodes as unknown as ClusterNode[];
      return mapRowToGraph(row, nodes);
    },
    null,
    `cluster read (${storageKey})`
  );
}

export async function getWalletCluster(
  seedAddress: string
): Promise<{ data: ClusterGraph; source: "redis" | "postgres" | "live" }> {
  const cached = await readClusterFromDb(seedAddress);
  if (cached) {
    return { data: cached, source: "postgres" };
  }

  const result = await getCachedOrFetch(
    walletClusterCacheKey(seedAddress),
    () => buildWalletCluster(seedAddress),
    { ttlSeconds: DEFAULT_CACHE_TTL_SECONDS }
  );

  if (result.source === "live") {
    await persistCluster(result.data);
  }

  return result;
}

export async function getTokenCreatorCluster(
  input: TokenCreatorClusterInput
): Promise<{ data: ClusterGraph; source: "redis" | "postgres" | "live" }> {
  const storageKey = `token:${input.mintAddress}`;
  const cached = await readClusterFromDb(storageKey);
  if (cached) {
    return { data: cached, source: "postgres" };
  }

  const result = await getCachedOrFetch(
    tokenClusterCacheKey(input.mintAddress),
    () => buildTokenCreatorCluster(input),
    { ttlSeconds: DEFAULT_CACHE_TTL_SECONDS }
  );

  if (result.source === "live") {
    await persistCluster(result.data);
  }

  return result;
}