import { fetchTokenLpInfo } from "@/lib/dexscreener";
import { HeliusError } from "./errors";
import { heliusRpc } from "./client";
import { fetchPumpBondingCurveCreator } from "./pump";
import type {
  EntityType,
  HeliusAsset,
  TokenChainData,
  TokenMetadata,
} from "./types";

const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const SYSTEM_PROGRAM = "11111111111111111111111111111111";
const PUMP_AMM_PROGRAM = "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";
const PUMP_BONDING_PROGRAM = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const TOKEN_PROGRAMS = new Set([TOKEN_PROGRAM, TOKEN_2022_PROGRAM]);
const FUNGIBLE_INTERFACES = new Set(["FungibleToken", "FungibleAsset"]);

function unsupportedAddressMessage(owner: string): string {
  if (owner === PUMP_AMM_PROGRAM) {
    return "This is a Pump liquidity pool address, not a token mint. On pump.fun or DexScreener, copy the token mint (often ends in ...pump), not the pool.";
  }

  if (owner === PUMP_BONDING_PROGRAM) {
    return "This is a Pump bonding curve address, not a token mint. Paste the token mint address instead.";
  }

  return "This address is not a wallet or token mint. Paste a Solana wallet or token mint address.";
}

interface AccountInfoResult {
  value: {
    owner: string;
    data?: {
      program?: string;
      parsed?: {
        type?: string;
        info?: {
          mintAuthority?: string | null;
          freezeAuthority?: string | null;
          supply?: string;
          decimals?: number;
        };
      };
    };
  } | null;
}

interface ProgramAccountEntry {
  pubkey: string;
}

interface LargestAccountsResult {
  value: Array<{
    uiAmount: number | null;
    amount: string;
  }>;
}

function isFungibleAsset(asset: HeliusAsset): boolean {
  if (asset.interface && FUNGIBLE_INTERFACES.has(asset.interface)) {
    return true;
  }

  return Boolean(asset.token_info);
}

export async function detectEntityType(address: string): Promise<EntityType> {
  const account = await heliusRpc<AccountInfoResult>("getAccountInfo", [
    address,
    { encoding: "jsonParsed" },
  ]);

  if (!account.value) {
    throw new HeliusError("Address not found on-chain", "NOT_FOUND");
  }

  const parsedType = account.value.data?.parsed?.type;
  if (parsedType === "mint") {
    return "token";
  }

  if (TOKEN_PROGRAMS.has(account.value.owner) && parsedType === "account") {
    return "wallet";
  }

  if (account.value.owner === SYSTEM_PROGRAM) {
    return "wallet";
  }

  try {
    const asset = await heliusRpc<HeliusAsset>("getAsset", { id: address });
    if (isFungibleAsset(asset)) {
      return "token";
    }
  } catch {
    // Asset not indexed or fetch failed — treat as unsupported below.
  }

  throw new HeliusError(
    unsupportedAddressMessage(account.value.owner),
    "NOT_FOUND"
  );
}

async function countTokenHolders(
  mintAddress: string,
  programId: string
): Promise<number> {
  const accounts = await heliusRpc<ProgramAccountEntry[]>("getProgramAccounts", [
    programId,
    {
      encoding: "jsonParsed",
      filters: [{ memcmp: { offset: 0, bytes: mintAddress } }],
    },
  ]);

  return accounts.length;
}

function computeTopHolderPercent(
  largestAccounts: LargestAccountsResult,
  supplyRaw: string,
  decimals: number
): number | null {
  const top = largestAccounts.value?.[0];
  if (!top) {
    return null;
  }

  const supplyUi = Number(supplyRaw) / 10 ** decimals;
  if (!Number.isFinite(supplyUi) || supplyUi <= 0) {
    return null;
  }

  const topUi =
    top.uiAmount ?? Number(top.amount) / 10 ** decimals;
  if (!Number.isFinite(topUi) || topUi < 0) {
    return null;
  }

  return Math.round((topUi / supplyUi) * 100);
}

function extractTokenMetadata(asset: HeliusAsset): TokenMetadata {
  const name =
    asset.content?.metadata?.name ??
    asset.mint_extensions?.metadata?.name ??
    null;
  const symbol =
    asset.content?.metadata?.symbol ??
    asset.mint_extensions?.metadata?.symbol ??
    asset.token_info?.symbol ??
    null;
  const imageUrl =
    asset.content?.links?.image ??
    asset.content?.files?.[0]?.cdn_uri ??
    asset.content?.files?.[0]?.uri ??
    null;

  return { name, symbol, imageUrl };
}

export async function fetchTokenChainData(
  mintAddress: string
): Promise<TokenChainData> {
  const account = await heliusRpc<AccountInfoResult>("getAccountInfo", [
    mintAddress,
    { encoding: "jsonParsed" },
  ]);

  if (!account.value?.data?.parsed?.info) {
    throw new HeliusError("Token mint not found on-chain", "NOT_FOUND");
  }

  const parsedInfo = account.value.data.parsed.info;
  const programId = TOKEN_PROGRAMS.has(account.value.owner)
    ? account.value.owner
    : TOKEN_2022_PROGRAM;

  const [asset, holderCount, largestAccounts, lp, pumpCreator] =
    await Promise.all([
      heliusRpc<HeliusAsset>("getAsset", { id: mintAddress }),
      countTokenHolders(mintAddress, programId),
      heliusRpc<LargestAccountsResult>("getTokenLargestAccounts", [mintAddress]),
      fetchTokenLpInfo(mintAddress),
      fetchPumpBondingCurveCreator(mintAddress),
    ]);

  const tokenInfo = asset.token_info ?? {};
  const decimals = parsedInfo.decimals ?? tokenInfo.decimals ?? 0;
  const supply = String(parsedInfo.supply ?? tokenInfo.supply ?? 0);

  const mintAuthority =
    parsedInfo.mintAuthority ??
    tokenInfo.mint_authority ??
    asset.authorities?.find((entry) => entry.scopes.includes("mint"))?.address ??
    null;
  const freezeAuthority =
    parsedInfo.freezeAuthority ??
    tokenInfo.freeze_authority ??
    asset.authorities?.find((entry) => entry.scopes.includes("freeze"))
      ?.address ??
    null;

  const creatorWallet =
    asset.creators?.[0]?.address ?? pumpCreator ?? null;
  const topHolderPercent = computeTopHolderPercent(
    largestAccounts,
    supply,
    decimals
  );
  const metadata = extractTokenMetadata(asset);

  return {
    mintAddress,
    ...metadata,
    supply,
    decimals,
    creatorWallet,
    holderCount,
    topHolderPercent,
    mintAuthority,
    freezeAuthority,
    mintAuthorityRevoked: mintAuthority === null,
    freezeAuthorityRevoked: freezeAuthority === null,
    lp,
  };
}