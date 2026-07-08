import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-error";
import { heliusRpc } from "@/lib/helius/client";

interface BlockhashResult {
  context: { slot: number };
  value: {
    blockhash: string;
    lastValidBlockHeight: number;
  };
}

export async function GET() {
  try {
    const result = await heliusRpc<BlockhashResult>("getLatestBlockhash", [
      { commitment: "confirmed" },
    ]);

    const { blockhash, lastValidBlockHeight } = result.value;
    if (!blockhash) {
      throw new Error("Helius returned an empty blockhash");
    }

    return NextResponse.json({
      blockhash,
      lastValidBlockHeight,
    });
  } catch (error) {
    return handleApiError(error);
  }
}