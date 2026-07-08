import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-error";
import { heliusRpc } from "@/lib/helius/client";

interface BlockhashResult {
  blockhash: string;
  lastValidBlockHeight: number;
}

export async function GET() {
  try {
    const result = await heliusRpc<BlockhashResult>("getLatestBlockhash", [
      { commitment: "confirmed" },
    ]);

    return NextResponse.json({
      blockhash: result.blockhash,
      lastValidBlockHeight: result.lastValidBlockHeight,
    });
  } catch (error) {
    return handleApiError(error);
  }
}