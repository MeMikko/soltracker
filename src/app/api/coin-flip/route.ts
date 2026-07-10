import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api/handle-error";
import { apiError } from "@/lib/api-errors";
import { pickRandomTrendingToken } from "@/lib/trending-tokens";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const token = await pickRandomTrendingToken();

    if (!token) {
      return apiError(
        "No trending tokens available right now. Try again shortly.",
        "NOT_FOUND",
        404
      );
    }

    return NextResponse.json(token);
  } catch (error) {
    return handleApiError(error);
  }
}