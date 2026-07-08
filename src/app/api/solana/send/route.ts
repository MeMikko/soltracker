import { NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/api/handle-error";
import { heliusRpc } from "@/lib/helius/client";

const bodySchema = z.object({
  transaction: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const { transaction } = bodySchema.parse(await request.json());

    const signature = await heliusRpc<string>("sendTransaction", [
      transaction,
      {
        encoding: "base64",
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      },
    ]);

    return NextResponse.json({ signature });
  } catch (error) {
    return handleApiError(error);
  }
}