/**
 * Zenerating — calm, mindful intelligence for Solana.
 * Smart due diligence instead of reckless aping.
 */
export const ZENERATING = {
  name: "Zenerating",
  tagline: "Mindful intelligence for Solana.",
  subtagline: "Clear-headed due diligence — not reckless aping.",
  description:
    "Zenerating maps wallet networks with calm clarity so you can research before you commit.",
} as const;

export const ZEN_BRAND = {
  colors: {
    sage: "#7d9b8a",
    mist: "#a8b5c4",
    sand: "#c4b5a0",
    deep: "#0a0f0d",
    surface: "#0f1412",
    card: "#141a17",
    border: "#1f2a24",
    glow: "rgba(125, 155, 138, 0.25)",
    low: "#7d9b8a",
    medium: "#c4b5a0",
    high: "#c97b7b",
  },
  voice: {
    calm: "Observe patterns. Act with intention.",
    clusterTitle: "Wallet Network",
    clusterSubtitle:
      "Funding paths, timing overlaps, and shared holdings — mapped with clarity.",
    emptyCluster: "No significant connections detected for this address yet.",
    loadingCluster: "Mapping wallet connections…",
  },
} as const;

export type ZenRiskLevel = "low" | "medium" | "high";