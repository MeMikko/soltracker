import { getCachedOrFetch, DEFAULT_CACHE_TTL_SECONDS } from "@/lib/cache";
import { hasDatabase } from "@/lib/config";
import { buildWalletCluster } from "@/lib/clustering";
import type { ClusterGraph, ClusterNode, ClusterEdge } from "@/lib/clustering/types";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";
import type { Prisma } from "@prisma/client";

const CLUSTER_CACHE_PREFIX = "cluster:v1:";

function clusterCacheKey(address: string): string {
  return `${CLUSTER_CACHE_PREFIX}${address}`;
}

async function persistCluster(graph: ClusterGraph): Promise<void> {
  if (!hasDatabase()) return;

  const expiresAt = new Date(
    Date.now() + DEFAULT_CACHE_TTL_SECONDS * 1000
  );

  await withDbFallback(
    async () => {
      const existing = await prisma.walletCluster.findUnique({
        where: { seedAddress: graph.seedAddress },
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
          seedAddress: graph.seedAddress,
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
    `cluster persist (${graph.seedAddress})`
  );
}

async function readClusterFromDb(
  seedAddress: string
): Promise<ClusterGraph | null> {
  if (!hasDatabase()) return null;

  return withDbFallback(
    async () => {
      const row = await prisma.walletCluster.findUnique({
        where: { seedAddress },
        include: { edges: true },
      });

      if (!row || row.expiresAt <= new Date()) {
        return null;
      }

      const nodes = row.nodes as unknown as ClusterNode[];
      const edges: ClusterEdge[] = row.edges.map((edge: {
        source: string;
        target: string;
        edgeType: string;
        weight: number;
        label: string | null;
      }) => ({
        id: `${edge.source}-${edge.target}-${edge.edgeType}`,
        source: edge.source,
        target: edge.target,
        type: edge.edgeType as ClusterEdge["type"],
        weight: edge.weight,
        label: edge.label ?? "",
      }));

      const signalCounts = {
        shared_funding: edges.filter((e) => e.type === "shared_funding").length,
        temporal: edges.filter((e) => e.type === "temporal").length,
        shared_token: edges.filter((e) => e.type === "shared_token").length,
      };

      return {
        seedAddress: row.seedAddress,
        nodes,
        edges,
        meta: {
          computedAt: row.calculatedAt.toISOString(),
          heuristicVersion: "zen-v1",
          signalCounts,
        },
      };
    },
    null,
    `cluster read (${seedAddress})`
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
    clusterCacheKey(seedAddress),
    () => buildWalletCluster(seedAddress),
    { ttlSeconds: DEFAULT_CACHE_TTL_SECONDS }
  );

  if (result.source === "live") {
    await persistCluster(result.data);
  }

  return result;
}