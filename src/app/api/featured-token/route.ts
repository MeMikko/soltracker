import { NextResponse } from "next/server";
import { getFeaturedTokenPublicSetting } from "@/lib/admin/featured-token-service";
import { toTokenDetails } from "@/lib/api/mappers";
import { peekCacheResult } from "@/lib/cache/peek-cache";
import { getTokenData, TOKEN_CACHE_KEY_PREFIX } from "@/lib/data";
import type { TokenChainData } from "@/lib/helius/index";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getFeaturedTokenPublicSetting();

  if (!config.enabled || !config.mint) {
    return NextResponse.json({
      enabled: false,
      mint: null,
      name: null,
      symbol: null,
      imageUrl: null,
      href: null,
    });
  }

  const { mint, href } = config;

  try {
    const cached = await peekCacheResult<TokenChainData>(
      `${TOKEN_CACHE_KEY_PREFIX}${mint}`
    );

    if (cached) {
      return NextResponse.json({
        enabled: true,
        ...toTokenDetails(cached.data),
        href,
      });
    }

    const result = await getTokenData(mint);
    return NextResponse.json({
      enabled: true,
      ...toTokenDetails(result.data),
      href,
    });
  } catch {
    return NextResponse.json({
      enabled: true,
      mint,
      name: null,
      symbol: null,
      imageUrl: null,
      href,
    });
  }
}