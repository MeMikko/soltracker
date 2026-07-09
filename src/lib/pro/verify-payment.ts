import { PRO_PRICE_LAMPORTS } from "./config";
import {
  TreasuryPaymentVerificationError,
  verifyTreasuryPayment,
} from "@/lib/payments/verify-treasury-payment";

export {
  parseTransferAmount,
  TreasuryPaymentVerificationError as ProPaymentVerificationError,
} from "@/lib/payments/verify-treasury-payment";

export async function verifyProPaymentSignature(
  signature: string,
  payerWallet: string
): Promise<{ lamports: number; paidAt: Date }> {
  return verifyTreasuryPayment(signature, payerWallet, PRO_PRICE_LAMPORTS);
}