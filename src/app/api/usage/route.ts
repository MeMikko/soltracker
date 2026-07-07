import { NextResponse } from "next/server";
import { getSearchUsage } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const usage = await getSearchUsage(request);
  return NextResponse.json(usage);
}