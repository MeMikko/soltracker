import { NextResponse } from "next/server";
import type { ApiError } from "./types";

export function apiError(
  message: string,
  code: ApiError["code"],
  status: number
) {
  return NextResponse.json({ error: message, code } satisfies ApiError, {
    status,
  });
}