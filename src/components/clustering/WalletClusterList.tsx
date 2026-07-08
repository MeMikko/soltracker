"use client";

import type { ClusterGraph, ClusterNode, ClusterNodeRole } from "@/lib/clustering/types";
import { truncateAddress } from "@/lib/format";

const GROUP_ORDER: ClusterNodeRole[] = [
  "funder",
  "creator",
  "seed",
  "mint",
  "sibling",
  "recipient",
  "peer",
];

const GROUP_LABEL: Record<ClusterNodeRole, string> = {
  funder: "Funders",
  creator: "Token creator",
  seed: "Searched wallet",
  mint: "Target token",
  sibling: "Sibling wallets",
  recipient: "Recipients",
  peer: "Connected wallets",
};

interface WalletClusterListProps {
  graph: ClusterGraph;
  onSelect?: (node: ClusterNode) => void;
  selectedId?: string | null;
}

function edgeSummary(
  graph: ClusterGraph,
  nodeId: string
): string[] {
  const labels: string[] = [];

  for (const edge of graph.edges) {
    if (edge.source === nodeId) {
      labels.push(`→ ${edge.label}`);
    } else if (edge.target === nodeId) {
      labels.push(`← ${edge.label}`);
    }
  }

  return labels.slice(0, 4);
}

export function WalletClusterList({
  graph,
  onSelect,
  selectedId,
}: WalletClusterListProps) {
  const byRole = new Map<ClusterNodeRole, ClusterNode[]>();

  for (const node of graph.nodes) {
    const list = byRole.get(node.role) ?? [];
    list.push(node);
    byRole.set(node.role, list);
  }

  const groups = GROUP_ORDER.filter((role) => byRole.has(role));

  return (
    <div className="space-y-4">
      {groups.map((role) => {
        const nodes = byRole.get(role) ?? [];

        return (
          <section key={role}>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zen-sage">
              {GROUP_LABEL[role]}
            </h4>
            <ul className="mt-2 space-y-2">
              {nodes.map((node) => {
                const links = edgeSummary(graph, node.id);
                const selected = selectedId === node.id;

                return (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => onSelect?.(node)}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        selected
                          ? "border-zen-sage/50 bg-zen-sage/10"
                          : "border-zen-border bg-zen-card hover:border-zen-sage/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-gray-200">
                            {node.label}
                          </p>
                          <p className="font-mono text-[10px] text-gray-500">
                            {truncateAddress(node.address, 6)}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-[10px] text-gray-500">
                          {node.riskScore}
                        </span>
                      </div>

                      {links.length > 0 && (
                        <ul className="mt-2 space-y-0.5 border-t border-zen-border/50 pt-2 text-[10px] text-gray-500">
                          {links.map((link) => (
                            <li key={link}>{link}</li>
                          ))}
                        </ul>
                      )}

                      {node.flags && node.flags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {node.flags.map((flag) => (
                            <span
                              key={flag}
                              className="rounded border border-accent-red/25 bg-accent-red/10 px-1.5 py-0.5 text-[9px] text-accent-red/90"
                            >
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}