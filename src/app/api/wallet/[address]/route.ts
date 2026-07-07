import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-error";
import { fetchWalletWithPolicy } from "@/lib/api/fetch-policy";
import { toWalletDetails } from "@/lib/api/mappers";
import { parseSolanaAddress } from "@/lib/validation";

export const maxDuration = 30;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address: raw } = await params;
    const address = parseSolanaAddress(decodeURIComponent(raw));

    const result = await fetchWalletWithPolicy(address, request);

    return NextResponse.json({
      ...toWalletDetails(result.data),
      usage: result.usage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}