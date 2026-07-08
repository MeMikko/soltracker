"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ClusterNodeRole, ClusterRiskLevel } from "@/lib/clustering/types";
import { ZEN_BRAND } from "@/lib/brand/zenerating";

export interface WalletClusterNodeData extends Record<string, unknown> {
  label: string;
  address: string;
  role: ClusterNodeRole;
  riskLevel: ClusterRiskLevel;
  riskScore: number;
  sharedTokens?: string[];
  flags?: string[];
  compact?: boolean;
}

const RISK_RING: Record<ClusterRiskLevel, string> = {
  low: ZEN_BRAND.colors.low,
  medium: ZEN_BRAND.colors.medium,
  high: ZEN_BRAND.colors.high,
};

const ROLE_LABEL: Record<ClusterNodeRole, string> = {
  seed: "Seed",
  creator: "Creator",
  mint: "Token",
  funder: "Funder",
  sibling: "Sibling",
  recipient: "Recipient",
  peer: "Peer",
};

const ROLE_RING: Partial<Record<ClusterNodeRole, string>> = {
  mint: "#9945ff",
  creator: ZEN_BRAND.colors.sage,
  sibling: ZEN_BRAND.colors.sand,
  funder: ZEN_BRAND.colors.mist,
};

function WalletClusterNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as WalletClusterNodeData;
  const ring = ROLE_RING[nodeData.role] ?? RISK_RING[nodeData.riskLevel];
  const compact = nodeData.compact ?? false;

  return (
    <div
      className={`rounded-xl border bg-zen-card shadow-zen transition-shadow ${
        compact ? "min-w-[100px] px-2 py-2" : "min-w-[132px] px-3 py-2.5"
      } ${selected ? "shadow-zen-lg" : ""}`}
      style={{
        borderColor: `${ring}55`,
        boxShadow: selected ? `0 0 0 1px ${ring}66` : undefined,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-zen-border !bg-zen-sage"
      />

      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: ring }}
          aria-hidden
        />
        <div className="min-w-0">
          <p
            className={`truncate font-medium text-gray-200 ${
              compact ? "text-[10px]" : "text-xs"
            }`}
          >
            {nodeData.label}
          </p>
          {!compact && (
            <p className="font-mono text-[10px] text-gray-500">
              {nodeData.address.slice(0, 4)}…{nodeData.address.slice(-4)}
            </p>
          )}
        </div>
      </div>

      <div
        className={`flex items-center justify-between gap-2 text-[10px] ${
          compact ? "mt-1" : "mt-2"
        }`}
      >
        <span className="rounded-full border border-zen-border/80 bg-zen-deep/60 px-1.5 py-0.5 text-zen-mist">
          {ROLE_LABEL[nodeData.role]}
        </span>
        <span className="font-mono text-gray-400">{nodeData.riskScore}</span>
      </div>

      {!compact && nodeData.flags && nodeData.flags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {nodeData.flags.slice(0, 2).map((flag) => (
            <span
              key={flag}
              className="rounded border border-accent-red/25 bg-accent-red/10 px-1.5 py-0.5 text-[9px] text-accent-red/90"
            >
              {flag}
            </span>
          ))}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-zen-border !bg-zen-sage"
      />
    </div>
  );
}

export const WalletClusterNode = memo(WalletClusterNodeComponent);