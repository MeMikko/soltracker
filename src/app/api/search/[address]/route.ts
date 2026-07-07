import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-error";
import { peekCacheResult } from "@/lib/cache/peek-cache";
import {
  getTokenData,
  getWalletData,
  TOKEN_CACHE_KEY_PREFIX,
} from "@/lib/data";
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address: raw } = await params;
    const address = parseSolanaAddress(decodeURIComponent(raw));

    const walletCached = await peekCacheResult(`wallet:${address}`);
    const tokenCached = await peekCacheResult(`${TOKEN_CACHE_KEY_PREFIX}${address}`);

    let type: EntityType;
    let usage = await getSearchUsage(request);

    if (walletCached) {
      type = "wallet";
    } else if (tokenCached) {
      type = "token";
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