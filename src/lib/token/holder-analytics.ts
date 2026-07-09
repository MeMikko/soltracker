import { heliusRpc } from "@/lib/helius/client";
import type { TokenLpInfo } from "@/lib/helius/types";
import type { HolderDistribution } from "@/lib/types";
import {
  buildLiquidityExclusionSet,
  isLiquidityHolder,
} from "./liquidity-exclusions";

const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const FULL_SCAN_HOLDER_LIMIT = 150;
const WHALE_THRESHOLD_PCT = 1;

export interface TopHolderEntry {
  owner: string;
  balance: number;
  percent: number;
  rank: number;
}

export interface HolderAnalytics {
  distribution: HolderDistribution;
  holderCount: number;
  sampled: boolean;
  topHolders: TopHolderEntry[];
  lpExcluded: boolean;
  excludedLiquidityPercent: number;
}

interface LargestAccountsResult {
  value: Array<{
    address: string;
    amount: string;
    decimals: number;
    uiAmount: number | null;
  }>;
}

interface ProgramAccountEntry {
  pubkey: string;
  account: {
    data: {
      parsed?: {
        info?: {
          owner?: string;
          tokenAmount?: {
            uiAmount?: number | null;
            amount?: string;
            decimals?: number;
          };
        };
      };
    };
  };
}

interface MultipleAccountsResult {
  value: Array<{
    data?: {
      parsed?: {
        info?: {
          owner?: string;
          tokenAmount?: {
            uiAmount?: number | null;
            amount?: string;
            decimals?: number;
          };
        };
      };
    };
  } | null>;
}

function supplyUi(supplyRaw: string, decimals: number): number {
  return Number(supplyRaw) / 10 ** decimals;
}

function computeGini(balances: number[]): number {
  const positive = balances.filter((value) => value > 0).sort((a, b) => a - b);
  const n = positive.length;
  if (n === 0) return 0;

  const total = positive.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return 0;

  let weighted = 0;
  for (let i = 0; i < n; i += 1) {
    weighted += (2 * (i + 1) - n - 1) * positive[i];
  }

  const gini = weighted / (n * total);
  return Math.max(0, Math.min(1, Math.round(gini * 1000) / 1000));
}

function computeDistribution(
  balances: number[],
  totalSupply: number
): HolderDistribution {
  const sorted = [...balances].filter((value) => value > 0).sort((a, b) => b - a);
  const sumTop = (count: number) =>
    sorted.slice(0, count).reduce((sum, value) => sum + value, 0);

  const top10Sum = sumTop(10);
  let top50Sum = 0;
  for (const balance of sorted) {
    top50Sum += balance;
    if (top50Sum >= totalSupply * 0.5) break;
  }

  const whaleCount = sorted.filter(
    (balance) => (balance / totalSupply) * 100 >= WHALE_THRESHOLD_PCT
  ).length;

  return {
    top10Percent:
      totalSupply > 0
        ? Math.round((top10Sum / totalSupply) * 1000) / 10
        : 0,
    top50Percent:
      totalSupply > 0
        ? Math.round((top50Sum / totalSupply) * 1000) / 10
        : 0,
    giniCoefficient: computeGini(balances),
    whaleCount,
  };
}

function buildTopHolders(
  entries: Array<{ owner: string; balance: number }>,
  totalSupply: number
): TopHolderEntry[] {
  return entries
    .filter((entry) => entry.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 10)
    .map((entry, index) => ({
      owner: entry.owner,
      balance: entry.balance,
      percent:
        totalSupply > 0
          ? Math.round((entry.balance / totalSupply) * 1000) / 10
          : 0,
      rank: index + 1,
    }));
}

async function resolveOwners(
  tokenAccounts: LargestAccountsResult["value"]
): Promise<Array<{ owner: string; balance: number }>> {
  if (tokenAccounts.length === 0) return [];

  const accounts = await heliusRpc<MultipleAccountsResult>("getMultipleAccounts", [
    tokenAccounts.map((entry) => entry.address),
    { encoding: "jsonParsed" },
  ]);

  return tokenAccounts
    .map((entry, index) => {
      const parsed = accounts.value[index]?.data?.parsed?.info;
      const owner = parsed?.owner ?? entry.address;
      const balance =
        parsed?.tokenAmount?.uiAmount ??
        entry.uiAmount ??
        Number(entry.amount) / 10 ** entry.decimals;

      return {
        owner,
        tokenAccount: entry.address,
        balance: Number.isFinite(balance) ? Number(balance) : 0,
      };
    })
    .filter((entry) => entry.balance > 0);
}

async function fetchAllHolderBalances(
  mintAddress: string,
  programId: string
): Promise<Array<{ owner: string; balance: number }>> {
  const accounts = await heliusRpc<ProgramAccountEntry[]>("getProgramAccounts", [
    programId,
    {
      encoding: "jsonParsed",
      filters: [{ memcmp: { offset: 0, bytes: mintAddress } }],
    },
  ]);

  return accounts
    .map((entry) => {
      const info = entry.account.data.parsed?.info;
      const owner = info?.owner ?? entry.pubkey;
      const balance =
        info?.tokenAmount?.uiAmount ??
        (info?.tokenAmount?.amount && info?.tokenAmount?.decimals != null
          ? Number(info.tokenAmount.amount) /
            10 ** info.tokenAmount.decimals
          : 0);

      return {
        owner,
        tokenAccount: entry.pubkey,
        balance: Number.isFinite(balance) ? Number(balance) : 0,
      };
    })
    .filter((entry) => entry.balance > 0);
}

type HolderEntry = {
  owner: string;
  tokenAccount?: string;
  balance: number;
};

function excludeLiquidityHolders(
  entries: HolderEntry[],
  excluded: Set<string>
): { holders: HolderEntry[]; excludedLiquidityPercent: number; lpExcluded: boolean } {
  let excludedBalance = 0;

  const holders = entries.filter((entry) => {
    if (isLiquidityHolder(entry, excluded)) {
      excludedBalance += entry.balance;
      return false;
    }
    return true;
  });

  const totalRaw = entries.reduce((sum, entry) => sum + entry.balance, 0);
  const excludedLiquidityPercent =
    totalRaw > 0
      ? Math.round((excludedBalance / totalRaw) * 1000) / 10
      : 0;

  return {
    holders,
    excludedLiquidityPercent,
    lpExcluded: excludedBalance > 0,
  };
}

async function detectTokenProgram(mintAddress: string): Promise<string> {
  const account = await heliusRpc<{ value: { owner: string } | null }>(
    "getAccountInfo",
    [mintAddress, { encoding: "jsonParsed" }]
  );

  const owner = account.value?.owner;
  if (owner === TOKEN_2022_PROGRAM) return TOKEN_2022_PROGRAM;
  return TOKEN_PROGRAM;
}

export async function fetchHolderAnalytics(input: {
  mintAddress: string;
  supplyRaw: string;
  decimals: number;
  holderCount: number;
  lp: TokenLpInfo;
}): Promise<HolderAnalytics> {
  const totalSupply = supplyUi(input.supplyRaw, input.decimals);
  const programId = await detectTokenProgram(input.mintAddress);
  const exclusionSet = await buildLiquidityExclusionSet({
    mintAddress: input.mintAddress,
    lp: input.lp,
  });

  let entries: HolderEntry[] = [];
  let sampled = false;

  if (input.holderCount > 0 && input.holderCount <= FULL_SCAN_HOLDER_LIMIT) {
    entries = await fetchAllHolderBalances(input.mintAddress, programId);
  } else {
    sampled = true;
    const largest = await heliusRpc<LargestAccountsResult>(
      "getTokenLargestAccounts",
      [input.mintAddress]
    );
    entries = await resolveOwners(largest.value ?? []);
  }

  const { holders, excludedLiquidityPercent, lpExcluded } =
    excludeLiquidityHolders(entries, exclusionSet);

  const balances = holders.map((entry) => entry.balance);
  const distribution = computeDistribution(balances, totalSupply);

  return {
    distribution,
    holderCount: input.holderCount,
    sampled,
    topHolders: buildTopHolders(holders, totalSupply),
    lpExcluded,
    excludedLiquidityPercent,
  };
}

export function mockHolderAnalytics(
  mint: string,
  holderCount: number
): HolderAnalytics {
  const seed = mint.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  const top10 = 18 + (seed % 35);
  const top50 = 42 + (seed % 40);
  const gini = 0.45 + (seed % 40) / 100;
  const whales = 1 + (seed % 5);

  return {
    holderCount,
    sampled: holderCount > FULL_SCAN_HOLDER_LIMIT,
    distribution: {
      top10Percent: top10,
      top50Percent: top50,
      giniCoefficient: Math.round(gini * 1000) / 1000,
      whaleCount: whales,
    },
    topHolders: Array.from({ length: 5 }, (_, index) => ({
      rank: index + 1,
      owner: `Demo${mint.slice(index, index + 6)}Holder`,
      balance: 1_000_000 * (5 - index),
      percent: Math.round((top10 / (index + 1)) * 10) / 10,
    })),
    lpExcluded: true,
    excludedLiquidityPercent: 42,
  };
}