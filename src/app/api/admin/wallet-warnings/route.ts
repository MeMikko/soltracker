import { NextResponse } from "next/server";
import { z } from "zod";
import {
  addWalletWarning,
  listWalletWarnings,
  removeWalletWarning,
} from "@/lib/admin/wallet-warning-service";
import { handleApiError } from "@/lib/api/handle-error";
import { assertAdminAccess } from "@/lib/auth/admin-access";
import { parseSolanaAddress } from "@/lib/validation";

const createSchema = z.object({
  wallet: z.string().trim().min(32).max(64),
  note: z.string().trim().max(500).optional(),
});

const deleteSchema = z.object({
  wallet: z.string().trim().min(32).max(64),
});

export async function GET(request: Request) {
  try {
    await assertAdminAccess(request);
    const warnings = await listWalletWarnings();
    return NextResponse.json({ warnings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const adminWallet = await assertAdminAccess(request);
    const body = createSchema.parse(await request.json());
    const wallet = parseSolanaAddress(body.wallet);

    const warning = await addWalletWarning(wallet, adminWallet, body.note);

    return NextResponse.json({ warning });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await assertAdminAccess(request);
    const body = deleteSchema.parse(await request.json());
    const wallet = parseSolanaAddress(body.wallet);
    const removed = await removeWalletWarning(wallet);

    return NextResponse.json({ removed, wallet });
  } catch (error) {
    return handleApiError(error);
  }
}