import { PublicKey } from "@solana/web3.js";
import { heliusRpc } from "./client";

const PUMP_PROGRAM = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const BONDING_CURVE_CREATOR_OFFSET = 49;
const BONDING_CURVE_CREATOR_END = 81;

interface AccountInfoResult {
  value: {
    data?: [string, string];
  } | null;
}

export async function fetchPumpBondingCurveCreator(
  mintAddress: string
): Promise<string | null> {
  try {
    const [bondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding-curve"), new PublicKey(mintAddress).toBuffer()],
      new PublicKey(PUMP_PROGRAM)
    );

    const account = await heliusRpc<AccountInfoResult>("getAccountInfo", [
      bondingCurve.toBase58(),
      { encoding: "base64" },
    ]);

    const encoded = account.value?.data?.[0];
    if (!encoded) {
      return null;
    }

    const data = Buffer.from(encoded, "base64");
    if (data.length < BONDING_CURVE_CREATOR_END) {
      return null;
    }

    return new PublicKey(
      data.subarray(BONDING_CURVE_CREATOR_OFFSET, BONDING_CURVE_CREATOR_END)
    ).toBase58();
  } catch {
    return null;
  }
}