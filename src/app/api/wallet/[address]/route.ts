import { NextResponse } from "next/server";
import { getWalletWarning } from "@/lib/admin/wallet-warning-service";
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
    const details = toWalletDetails(result.data);
    const walletWarning = await getWalletWarning(details.address);

    return NextResponse.json({
      ...details,
      walletWarning,
      usage: result.usage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}