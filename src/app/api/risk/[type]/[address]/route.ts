import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-errors";
import { handleApiError } from "@/lib/api/handle-error";
import {
  fetchTokenWithPolicy,
  fetchWalletWithPolicy,
} from "@/lib/api/fetch-policy";
import { computeAndPersistRisk } from "@/lib/data/risk-service";

import type { EntityType } from "@/lib/types";
import { parseSolanaAddress } from "@/lib/validation";

export const maxDuration = 30;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string; address: string }> }
) {
  try {
    const { type: rawType, address: rawAddress } = await params;
    const address = parseSolanaAddress(decodeURIComponent(rawAddress));
    if (rawType !== "wallet" && rawType !== "token") {
      return apiError(
        'Invalid type — must be "wallet" or "token"',
        "INVALID_ADDRESS",
        400
      );
    }

    const type = rawType as EntityType;

    const result =
      type === "wallet"
        ? await fetchWalletWithPolicy(address, request)
        : await fetchTokenWithPolicy(address, request);

    const risk = await computeAndPersistRisk(address, type, result.data);

    return NextResponse.json({
      ...risk,
      usage: result.usage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}