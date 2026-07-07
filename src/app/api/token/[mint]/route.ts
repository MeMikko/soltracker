import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-error";
import { fetchTokenWithPolicy } from "@/lib/api/fetch-policy";
import { toTokenDetails } from "@/lib/api/mappers";
import { parseSolanaAddress } from "@/lib/validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mint: string }> }
) {
  try {
    const { mint: raw } = await params;
    const mint = parseSolanaAddress(decodeURIComponent(raw));

    const result = await fetchTokenWithPolicy(mint, request);

    return NextResponse.json({
      ...toTokenDetails(result.data),
      usage: result.usage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}