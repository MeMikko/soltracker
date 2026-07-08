"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { ClusterGraph, ClusterNode } from "@/lib/clustering/types";
import { ZEN_BRAND } from "@/lib/brand/zenerating";
import { WalletClusterList } from "./WalletClusterList";
import {
  WalletClusterNode,
  type WalletClusterNodeData,
} from "./WalletClusterNode";

const nodeTypes = { walletCluster: WalletClusterNode };

const EDGE_COLORS: Record<
  import("@/lib/clustering/types").ClusterEdgeType,
  string
> = {
  shared_funding: ZEN_BRAND.colors.sage,
  temporal: ZEN_BRAND.colors.mist,
  shared_token: ZEN_BRAND.colors.sand,
  token_launch: "#9945ff",
  coordinated_buy: "#e8a87c",
  rug_link: ZEN_BRAND.colors.high,
};

const RISK_MINIMAP: Record<WalletClusterNodeData["riskLevel"], string> = {
  low: ZEN_BRAND.colors.low,
  medium: ZEN_BRAND.colors.medium,
  high: ZEN_BRAND.colors.high,
};

type ViewMode = "graph" | "list";

function nodeData(node: ClusterGraph["nodes"][number]): WalletClusterNodeData {
  return {
    label: node.label,
    address: node.address,
    role: node.role,
    riskLevel: node.riskLevel,
    riskScore: node.riskScore,
    sharedTokens: node.sharedTokens,
    flags: node.flags,
  };
}

function layoutNodes(graph: ClusterGraph): Node<WalletClusterNodeData>[] {
  const center =
    graph.nodes.find((n) => n.role === "creator") ??
    graph.nodes.find((n) => n.role === "seed") ??
    graph.nodes[0];
  const mintNode = graph.nodes.find((n) => n.role === "mint");
  const orbit = graph.nodes.filter(
    (n) => n.id !== center?.id && n.id !== mintNode?.id
  );

  const centerX = 280;
  const centerY = 200;
  const radius = 160;
  const positioned: Node<WalletClusterNodeData>[] = [];

  if (center) {
    positioned.push({
      id: center.id,
      type: "walletCluster",
      position: { x: centerX, y: centerY },
      data: nodeData(center),
    });
  }

  if (mintNode) {
    positioned.push({
      id: mintNode.id,
      type: "walletCluster",
      position: { x: centerX + 20, y: centerY + 110 },
      data: nodeData(mintNode),
    });
  }

  orbit.forEach((node, index) => {
    const angle =
      (index / Math.max(orbit.length, 1)) * Math.PI * 2 - Math.PI / 2;
    positioned.push({
      id: node.id,
      type: "walletCluster",
      position: {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      },
      data: nodeData(node),
    });
  });

  return positioned;
}

function toFlowEdges(graph: ClusterGraph): Edge[] {
  return graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated:
      edge.type === "temporal" ||
      edge.type === "token_launch" ||
      edge.type === "coordinated_buy",
    style: {
      stroke: EDGE_COLORS[edge.type],
      strokeWidth: 1 + edge.weight * 0.6,
      opacity: 0.75,
    },
    labelStyle: {
      fill: ZEN_BRAND.colors.mist,
      fontSize: 10,
      fontWeight: 500,
    },
    labelBgStyle: {
      fill: ZEN_BRAND.colors.card,
      fillOpacity: 0.92,
    },
    labelBgPadding: [6, 4] as [number, number],
    labelBgBorderRadius: 6,
  }));
}

function usePrefersListOnMobile(): boolean {
  const [prefersList, setPrefersList] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setPrefersList(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return prefersList;
}

interface WalletClusterGraphProps {
  graph: ClusterGraph;
  className?: string;
}

export function WalletClusterGraph({
  graph,
  className = "",
}: WalletClusterGraphProps) {
  const prefersListOnMobile = usePrefersListOnMobile();
  const [view, setView] = useState<ViewMode>("graph");
  const [hovered, setHovered] = useState<WalletClusterNodeData | null>(null);
  const [listSelected, setListSelected] = useState<ClusterNode | null>(null);

  useEffect(() => {
    setView(prefersListOnMobile ? "list" : "graph");
  }, [prefersListOnMobile]);

  const nodes = useMemo(() => layoutNodes(graph), [graph]);
  const edges = useMemo(() => toFlowEdges(graph), [graph]);

  const onNodeMouseEnter: NodeMouseHandler = useCallback((_event, node) => {
    setHovered(node.data as WalletClusterNodeData);
  }, []);

  const onNodeMouseLeave: NodeMouseHandler = useCallback(() => {
    setHovered(null);
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setHovered(node.data as WalletClusterNodeData);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] text-gray-500">
          {view === "list"
            ? "Grouped by role — tap a wallet for details."
            : "Hover a node for wallet details. Scroll to zoom, drag to pan."}
        </p>
        <div className="flex shrink-0 rounded-lg border border-zen-border bg-zen-deep p-0.5 text-[10px]">
          <ViewToggle
            active={view === "list"}
            label="List"
            onClick={() => setView("list")}
          />
          <ViewToggle
            active={view === "graph"}
            label="Map"
            onClick={() => setView("graph")}
          />
        </div>
      </div>

      {view === "list" ? (
        <>
          <div className="rounded-xl border border-zen-border bg-zen-deep p-3 sm:p-4">
            <WalletClusterList
              graph={graph}
              selectedId={listSelected?.id}
              onSelect={setListSelected}
            />
          </div>
          {listSelected && (
            <ListDetailPanel node={listSelected} className="mt-3" />
          )}
        </>
      ) : (
        <div className="relative">
          <div className="zen-flow h-[420px] w-full overflow-hidden rounded-xl border border-zen-border bg-zen-deep sm:h-[480px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              minZoom={0.35}
              maxZoom={1.8}
              proOptions={{ hideAttribution: true }}
              onNodeMouseEnter={onNodeMouseEnter}
              onNodeMouseLeave={onNodeMouseLeave}
              onNodeClick={onNodeClick}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={22}
                size={1}
                color={ZEN_BRAND.colors.border}
              />
              <Controls
                showInteractive={false}
                className="!rounded-lg !border-zen-border !bg-zen-card !shadow-zen"
              />
              <MiniMap
                nodeColor={(node) =>
                  RISK_MINIMAP[(node.data as WalletClusterNodeData).riskLevel]
                }
                maskColor="rgba(10, 15, 13, 0.75)"
                className="!rounded-lg !border-zen-border !bg-zen-card"
              />
            </ReactFlow>
          </div>

          <div
            className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-lg border border-zen-border/80 bg-zen-card/95 px-3 py-2 backdrop-blur-sm sm:right-auto sm:min-w-[240px]"
            aria-live="polite"
          >
            {hovered ? (
              <NodeDetailContent data={hovered} />
            ) : (
              <p className="text-[10px] text-gray-500">
                Hover a node for wallet details. Scroll to zoom, drag to pan.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-gray-500">
        <LegendDot color={EDGE_COLORS.shared_funding} label="Shared funding" />
        <LegendDot color={EDGE_COLORS.temporal} label="Temporal overlap" />
        <LegendDot color={EDGE_COLORS.shared_token} label="Shared tokens" />
        {graph.meta.context === "token_creator" && (
          <>
            <LegendDot color={EDGE_COLORS.token_launch} label="Token launch" />
            <LegendDot
              color={EDGE_COLORS.coordinated_buy}
              label="Coordinated buy"
            />
            <LegendDot color={EDGE_COLORS.rug_link} label="Prior deploy link" />
          </>
        )}
      </div>
    </div>
  );
}

function NodeDetailContent({ data }: { data: WalletClusterNodeData }) {
  return (
    <div className="text-xs">
      <p className="font-medium text-gray-200">{data.label}</p>
      <p className="mt-0.5 font-mono text-[10px] text-gray-500">
        {data.address}
      </p>
      <p className="mt-1 text-[10px] text-zen-mist">
        Risk {data.riskScore} · {data.role}
        {data.sharedTokens?.length
          ? ` · Tokens: ${data.sharedTokens.join(", ")}`
          : ""}
      </p>
      {data.flags && data.flags.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 text-[10px] text-accent-red/90">
          {data.flags.map((flag) => (
            <li key={flag}>· {flag}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ListDetailPanel({
  node,
  className = "",
}: {
  node: ClusterNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-zen-border/80 bg-zen-card px-3 py-2 ${className}`}
      aria-live="polite"
    >
      <NodeDetailContent
        data={{
          label: node.label,
          address: node.address,
          role: node.role,
          riskLevel: node.riskLevel,
          riskScore: node.riskScore,
          sharedTokens: node.sharedTokens,
          flags: node.flags,
        }}
      />
    </div>
  );
}

function ViewToggle({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
        active
          ? "bg-zen-sage/20 text-zen-sage"
          : "text-gray-500 hover:text-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {label}
    </span>
  );
}