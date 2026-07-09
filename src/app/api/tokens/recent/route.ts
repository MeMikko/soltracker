import { NextResponse } from "next/server";
import { getRecentTokenSearches } from "@/lib/data/token-search-stats";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? "10");
  const limit = Number.isFinite(limitParam) ? limitParam : 10;

  const tokens = await getRecentTokenSearches(limit);

  return NextResponse.json({ tokens });
}