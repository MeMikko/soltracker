import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-error";
import { fetchTokenWithPolicy } from "@/lib/api/fetch-policy";
import { toTokenDetails } from "@/lib/api/mappers";
import { recordTokenSearch } from "@/lib/data/token-search-stats";
import { parseSolanaAddress } from "@/lib/validation";

export const maxDuration = 30;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mint: string }> }
) {
  try {
    const { mint: raw } = await params;
    const mint = parseSolanaAddress(decodeURIComponent(raw));

    const result = await fetchTokenWithPolicy(mint, request);
    const details = toTokenDetails(result.data);

    await recordTokenSearch({
      mint: details.mint,
      name: details.name,
      symbol: details.symbol,
      imageUrl: details.imageUrl,
    });

    return NextResponse.json({
      ...details,
      usage: result.usage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}