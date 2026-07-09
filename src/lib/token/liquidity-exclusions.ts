import { PublicKey } from "@solana/web3.js";
import { heliusRpc } from "@/lib/helius/client";
import type { TokenLpInfo } from "@/lib/helius/types";

const PUMP_PROGRAM = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
interface TokenAccountsByOwnerResult {
  value: Array<{ pubkey: string }>;
}

export function derivePumpBondingCurveAddress(mintAddress: string): string {
  const [bondingCurve] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding-curve"), new PublicKey(mintAddress).toBuffer()],
    new PublicKey(PUMP_PROGRAM)
  );
  return bondingCurve.toBase58();
}

async function tokenAccountsForOwner(
  owner: string,
  mintAddress: string
): Promise<string[]> {
  try {
    const result = await heliusRpc<TokenAccountsByOwnerResult>(
      "getTokenAccountsByOwner",
      [owner, { mint: mintAddress }, { encoding: "jsonParsed" }]
    );
    return (result.value ?? []).map((entry) => entry.pubkey);
  } catch {
    return [];
  }
}

export async function buildLiquidityExclusionSet(input: {
  mintAddress: string;
  lp: TokenLpInfo;
}): Promise<Set<string>> {
  const excluded = new Set<string>();
  const ownersToScan = new Set<string>();

  ownersToScan.add(derivePumpBondingCurveAddress(input.mintAddress));

  if (input.lp.poolAddress) {
    ownersToScan.add(input.lp.poolAddress);
  }

  for (const owner of ownersToScan) {
    excluded.add(owner);
    const vaults = await tokenAccountsForOwner(owner, input.mintAddress);
    for (const vault of vaults) {
      excluded.add(vault);
    }
  }

  return excluded;
}

export function isLiquidityHolder(
  entry: { owner: string; tokenAccount?: string },
  excluded: Set<string>
): boolean {
  if (excluded.has(entry.owner)) return true;
  if (entry.tokenAccount && excluded.has(entry.tokenAccount)) return true;
  return false;
}