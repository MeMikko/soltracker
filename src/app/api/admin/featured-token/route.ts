import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getFeaturedTokenAdminSetting,
  updateFeaturedTokenAdminSetting,
} from "@/lib/admin/featured-token-service";
import { handleApiError } from "@/lib/api/handle-error";
import { toTokenDetails } from "@/lib/api/mappers";
import { assertAdminAccess } from "@/lib/auth/admin-access";
import { getTokenData } from "@/lib/data";
import { parseSolanaAddress } from "@/lib/validation";

const updateSchema = z.object({
  enabled: z.boolean(),
  mint: z.string().trim().min(32).max(64).optional(),
});

export async function GET(request: Request) {
  try {
    await assertAdminAccess(request);
    const setting = await getFeaturedTokenAdminSetting();

    let preview = null;
    if (setting.enabled && setting.mint) {
      try {
        const result = await getTokenData(setting.mint);
        preview = toTokenDetails(result.data);
      } catch {
        preview = {
          mint: setting.mint,
          name: null,
          symbol: null,
          imageUrl: null,
        };
      }
    }

    return NextResponse.json({ setting, preview });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const wallet = await assertAdminAccess(request);
    const body = updateSchema.parse(await request.json());
    const mint = body.mint ? parseSolanaAddress(body.mint) : undefined;

    const setting = await updateFeaturedTokenAdminSetting(wallet, {
      enabled: body.enabled,
      mint,
    });

    let preview = null;
    if (setting.enabled && setting.mint) {
      try {
        const result = await getTokenData(setting.mint);
        preview = toTokenDetails(result.data);
      } catch {
        preview = {
          mint: setting.mint,
          name: null,
          symbol: null,
          imageUrl: null,
        };
      }
    }

    return NextResponse.json({ setting, preview });
  } catch (error) {
    return handleApiError(error);
  }
}