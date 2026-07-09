import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-error";
import { peekCacheResult } from "@/lib/cache/peek-cache";
import {
  getTokenData,
  getWalletData,
  recordTokenSearch,
  TOKEN_CACHE_KEY_PREFIX,
} from "@/lib/data";
import type { TokenChainData } from "@/lib/helius/index";
import { detectEntityType, hasHeliusApiKey } from "@/lib/helius/index";
import { mockEntityType } from "@/lib/mock-data";
import {
  assertCanSearch,
  consumeSearchForAddress,
  getSearchUsage,
} from "@/lib/rate-limit";
import type { EntityType, SearchResponse } from "@/lib/types";
import { parseSolanaAddress } from "@/lib/validation";

export const maxDuration = 30;

async function recordSearchIfToken(
  address: string,
  type: EntityType,
  tokenData?: TokenChainData
): Promise<void> {
  if (type !== "token") return;

  await recordTokenSearch({
    mint: address,
    name: tokenData?.name ?? null,
    symbol: tokenData?.symbol ?? null,
    imageUrl: tokenData?.imageUrl ?? null,
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address: raw } = await params;
    const address = parseSolanaAddress(decodeURIComponent(raw));

    const walletCached = await peekCacheResult(`wallet:${address}`);
    const tokenCached = await peekCacheResult<TokenChainData>(
      `${TOKEN_CACHE_KEY_PREFIX}${address}`
    );

    let type: EntityType;
    let usage = await getSearchUsage(request);

    if (walletCached) {
      type = "wallet";
    } else if (tokenCached) {
      type = "token";
      await recordSearchIfToken(address, type, tokenCached.data);
    } else {
      await assertCanSearch(request);
      type = hasHeliusApiKey()
        ? await detectEntityType(address)
        : mockEntityType(address);

      const dataResult =
        type === "wallet"
          ? await getWalletData(address)
          : await getTokenData(address);

      usage =
        dataResult.source === "live"
          ? await consumeSearchForAddress(request, address)
          : await getSearchUsage(request);

      if (type === "token") {
        await recordSearchIfToken(
          address,
          type,
          dataResult.data as TokenChainData
        );
      }
    }

    const body: SearchResponse & { usage: typeof usage } = {
      address,
      type,
      usage,
    };

    return NextResponse.json(body);
  } catch (error) {
    return handleApiError(error);
  }
}