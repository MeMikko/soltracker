import { NextResponse } from "next/server";
import { getAdminAnalytics } from "@/lib/admin/analytics-service";
import { handleApiError } from "@/lib/api/handle-error";
import { assertAdminAccess } from "@/lib/auth/admin-access";

export async function GET(request: Request) {
  try {
    await assertAdminAccess(request);
    const analytics = await getAdminAnalytics();
    return NextResponse.json(analytics);
  } catch (error) {
    return handleApiError(error);
  }
}