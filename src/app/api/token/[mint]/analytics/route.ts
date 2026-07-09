import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-error";
import { fetchTokenAnalyticsWithPolicy } from "@/lib/api/fetch-policy";
import { assertProAccess } from "@/lib/pro/access";
import { parseSolanaAddress } from "@/lib/validation";

export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mint: string }> }
) {
  try {
    const { mint: raw } = await params;
    const mint = parseSolanaAddress(decodeURIComponent(raw));
    await assertProAccess(request);
    const result = await fetchTokenAnalyticsWithPolicy(mint, request);

    return NextResponse.json({
      ...result.data,
      source: result.source,
      usage: result.usage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}