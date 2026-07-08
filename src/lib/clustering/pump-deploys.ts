import { heliusRpc } from "@/lib/helius/client";
import { hasDatabase } from "@/lib/config";
import { prisma } from "@/lib/db";
import { withDbFallback } from "@/lib/db-safe";

interface AccountMintInfo {
  value: {
    data?: {
      parsed?: {
        info?: {
          mintAuthority?: string | null;
        };
      };
    };
  } | null;
}

interface SearchAssetsResult {
  items?: Array<{ id: string }>;
}

export interface PriorDeploy {
  mint: string;
  mintAuthorityActive: boolean;
}

async function searchMintsByCreator(wallet: string): Promise<string[]> {
  try {
    const result = await heliusRpc<SearchAssetsResult>("searchAssets", {
      creatorAddress: wallet,
      page: 1,
      limit: 12,
    });
    return (result.items ?? []).map((item) => item.id);
  } catch {
    return [];
  }
}

async function readDeploysFromDb(
  wallet: string,
  excludeMint: string
): Promise<PriorDeploy[]> {
  if (!hasDatabase()) return [];

  return withDbFallback(
    async () => {
      const rows = await prisma.token.findMany({
        where: {
          creatorWallet: wallet,
          mintAddress: { not: excludeMint },
        },
        select: {
          mintAddress: true,
          mintAuthority: true,
        },
        take: 8,
      });

      return rows.map((row) => ({
        mint: row.mintAddress,
        mintAuthorityActive: row.mintAuthority !== null,
      }));
    },
    [],
    `prior deploys db (${wallet})`
  );
}

async function mintAuthorityActive(mint: string): Promise<boolean> {
  try {
    const account = await heliusRpc<AccountMintInfo>("getAccountInfo", [
      mint,
      { encoding: "jsonParsed" },
    ]);
    const mintAuthority =
      account.value?.data?.parsed?.info?.mintAuthority ?? null;
    return mintAuthority !== null;
  } catch {
    return true;
  }
}

export async function findPriorPumpDeploys(
  wallet: string,
  excludeMint: string
): Promise<PriorDeploy[]> {
  const fromDb = await readDeploysFromDb(wallet, excludeMint);
  if (fromDb.length > 0) {
    return fromDb;
  }

  const mintIds = (await searchMintsByCreator(wallet))
    .filter((id) => id !== excludeMint)
    .slice(0, 6);

  const deploys: PriorDeploy[] = [];
  await Promise.all(
    mintIds.map(async (mint) => {
      deploys.push({
        mint,
        mintAuthorityActive: await mintAuthorityActive(mint),
      });
    })
  );

  return deploys;
}