import { NextResponse } from "next/server";
import { toTokenDetails } from "@/lib/api/mappers";
import { peekCacheResult } from "@/lib/cache/peek-cache";
import { getTokenData, TOKEN_CACHE_KEY_PREFIX } from "@/lib/data";
import { FEATURED_TOKEN } from "@/lib/featured-token";
import type { TokenChainData } from "@/lib/helius/index";

export const dynamic = "force-dynamic";

export async function GET() {
  const { mint, href } = FEATURED_TOKEN;

  try {
    const cached = await peekCacheResult<TokenChainData>(
      `${TOKEN_CACHE_KEY_PREFIX}${mint}`
    );

    if (cached) {
      return NextResponse.json({
        ...toTokenDetails(cached.data),
        href,
      });
    }

    const result = await getTokenData(mint);
    return NextResponse.json({
      ...toTokenDetails(result.data),
      href,
    });
  } catch {
    return NextResponse.json({
      mint,
      name: null,
      symbol: null,
      imageUrl: null,
      href,
    });
  }
}