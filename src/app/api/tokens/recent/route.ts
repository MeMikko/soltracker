import { NextResponse } from "next/server";
import {
  getTokenSearches,
  type TokenSearchSort,
} from "@/lib/data/token-search-stats";

export const dynamic = "force-dynamic";

function parseSort(value: string | null): TokenSearchSort {
  return value === "recent" ? "recent" : "popular";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? "10");
  const limit = Number.isFinite(limitParam) ? limitParam : 10;
  const sort = parseSort(searchParams.get("sort"));

  const { tokens, total } = await getTokenSearches(limit, sort);

  return NextResponse.json({ tokens, total, sort });
}