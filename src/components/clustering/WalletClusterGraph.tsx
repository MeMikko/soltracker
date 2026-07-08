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
import { clusterCanvasHeight, layoutClusterNodes } from "./layout-cluster";
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

function nodeData(
  node: ClusterGraph["nodes"][number],
  compact: boolean
): WalletClusterNodeData {
  return {
    label: node.label,
    address: node.address,
    role: node.role,
    riskLevel: node.riskLevel,
    riskScore: node.riskScore,
    sharedTokens: node.sharedTokens,
    flags: node.flags,
    compact,
  };
}

function buildFlowNodes(
  graph: ClusterGraph,
  compact: boolean
): Node<WalletClusterNodeData>[] {
  const positions = layoutClusterNodes(graph, compact);
  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));

  return positions.map(({ id, x, y }) => {
    const node = nodeById.get(id)!;
    return {
      id,
      type: "walletCluster",
      position: { x, y },
      data: nodeData(node, compact),
    };
  });
}

function toFlowEdges(graph: ClusterGraph, showLabels: boolean): Edge[] {
  return graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
    label: showLabels ? edge.label : undefined,
    animated:
      edge.type === "temporal" ||
      edge.type === "token_launch" ||
      edge.type === "coordinated_buy",
    style: {
      stroke: EDGE_COLORS[edge.type],
      strokeWidth: 1 + edge.weight * 0.5,
      opacity: showLabels ? 0.75 : 0.55,
    },
    labelStyle: showLabels
      ? {
          fill: ZEN_BRAND.colors.mist,
          fontSize: 10,
          fontWeight: 500,
        }
      : undefined,
    labelBgStyle: showLabels
      ? {
          fill: ZEN_BRAND.colors.card,
          fillOpacity: 0.92,
        }
      : undefined,
    labelBgPadding: showLabels ? ([6, 4] as [number, number]) : undefined,
    labelBgBorderRadius: showLabels ? 6 : undefined,
  }));
}

function useIsCompact(): boolean {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return compact;
}

interface WalletClusterGraphProps {
  graph: ClusterGraph;
  className?: string;
}

export function WalletClusterGraph({
  graph,
  className = "",
}: WalletClusterGraphProps) {
  const compact = useIsCompact();
  const [view, setView] = useState<ViewMode>("graph");
  const [selected, setSelected] = useState<WalletClusterNodeData | null>(null);

  useEffect(() => {
    setView(compact ? "list" : "graph");
  }, [compact]);

  const nodes = useMemo(
    () => buildFlowNodes(graph, compact),
    [graph, compact]
  );
  const edges = useMemo(
    () => toFlowEdges(graph, !compact),
    [graph, compact]
  );
  const canvasHeight = useMemo(
    () => clusterCanvasHeight(graph, compact),
    [graph, compact]
  );

  const onNodeMouseEnter: NodeMouseHandler = useCallback((_event, node) => {
    setSelected(node.data as WalletClusterNodeData);
  }, []);

  const onNodeMouseLeave: NodeMouseHandler = useCallback(() => {
    if (!compact) setSelected(null);
  }, [compact]);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelected(node.data as WalletClusterNodeData);
  }, []);

  const selectedNode = useMemo((): ClusterNode | null => {
    if (!selected) return null;
    return graph.nodes.find((n) => n.address === selected.address) ?? null;
  }, [graph.nodes, selected]);

  return (
    <div className={`relative ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] text-gray-500">
          {view === "list"
            ? "Grouped by role — tap a wallet for details."
            : compact
              ? "Pinch to zoom · drag to pan"
              : "Hover a node for details · scroll to zoom"}
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
        <div className="rounded-xl border border-zen-border bg-zen-deep p-3 sm:p-4">
          <WalletClusterList
            graph={graph}
            selectedId={selectedNode?.id}
            onSelect={(node) =>
              setSelected({
                label: node.label,
                address: node.address,
                role: node.role,
                riskLevel: node.riskLevel,
                riskScore: node.riskScore,
                sharedTokens: node.sharedTokens,
                flags: node.flags,
              })
            }
          />
        </div>
      ) : (
        <div
          className="zen-flow w-full overflow-hidden rounded-xl border border-zen-border bg-zen-deep"
          style={{ height: canvasHeight }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: compact ? 0.12 : 0.22 }}
            minZoom={0.25}
            maxZoom={1.6}
            proOptions={{ hideAttribution: true }}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            onNodeClick={onNodeClick}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={compact ? 18 : 22}
              size={1}
              color={ZEN_BRAND.colors.border}
            />
            <Controls
              showInteractive={false}
              className="!rounded-lg !border-zen-border !bg-zen-card !shadow-zen"
            />
            {!compact && (
              <MiniMap
                nodeColor={(node) =>
                  RISK_MINIMAP[(node.data as WalletClusterNodeData).riskLevel]
                }
                maskColor="rgba(10, 15, 13, 0.75)"
                className="!rounded-lg !border-zen-border !bg-zen-card"
              />
            )}
          </ReactFlow>
        </div>
      )}

      {selected && (
        <div
          className="mt-3 rounded-lg border border-zen-border/80 bg-zen-card px-3 py-2"
          aria-live="polite"
        >
          <div className="text-xs">
            <p className="font-medium text-gray-200">{selected.label}</p>
            <p className="mt-0.5 font-mono text-[10px] text-gray-500">
              {selected.address}
            </p>
            <p className="mt-1 text-[10px] text-zen-mist">
              Risk {selected.riskScore} · {selected.role}
              {selected.sharedTokens?.length
                ? ` · Tokens: ${selected.sharedTokens.join(", ")}`
                : ""}
            </p>
            {selected.flags && selected.flags.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 text-[10px] text-accent-red/90">
                {selected.flags.map((flag) => (
                  <li key={flag}>· {flag}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-gray-500">
        <LegendDot color={EDGE_COLORS.shared_funding} label="Funding" />
        {!compact && (
          <>
            <LegendDot color={EDGE_COLORS.temporal} label="Timing" />
            <LegendDot color={EDGE_COLORS.shared_token} label="Shared tokens" />
          </>
        )}
        {graph.meta.context === "token_creator" && (
          <>
            <LegendDot color={EDGE_COLORS.token_launch} label="Launch" />
            <LegendDot color={EDGE_COLORS.coordinated_buy} label="Co-buy" />
            <LegendDot color={EDGE_COLORS.rug_link} label="Prior deploy" />
          </>
        )}
      </div>
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