import { heliusRpc } from "@/lib/helius/client";

interface FungibleAsset {
  id: string;
}

interface AssetsResult {
  items: FungibleAsset[];
}

export async function walletHoldsMint(
  wallet: string,
  mintAddress: string
): Promise<boolean> {
  const result = await heliusRpc<AssetsResult>("getAssetsByOwner", {
    ownerAddress: wallet,
    page: 1,
    limit: 50,
    options: { showFungible: true },
  });

  return (result.items ?? []).some((item) => item.id === mintAddress);
}

export async function fetchWalletMintIds(wallet: string): Promise<string[]> {
  const result = await heliusRpc<AssetsResult>("getAssetsByOwner", {
    ownerAddress: wallet,
    page: 1,
    limit: 24,
    options: { showFungible: true },
  });

  return (result.items ?? []).map((item) => item.id);
}