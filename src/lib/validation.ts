import { z } from "zod";

const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export const solanaAddressSchema = z
  .string()
  .trim()
  .regex(BASE58_REGEX, "Invalid Solana address — must be base58, 32–44 characters");

export type SolanaAddress = z.infer<typeof solanaAddressSchema>;

export function parseSolanaAddress(input: string): SolanaAddress {
  return solanaAddressSchema.parse(input);
}

export function safeParseSolanaAddress(input: string) {
  return solanaAddressSchema.safeParse(input);
}

/** @deprecated Use `parseSolanaAddress` or `safeParseSolanaAddress` */
export function isValidSolanaAddress(input: string): boolean {
  return solanaAddressSchema.safeParse(input).success;
}

export function normalizeAddress(input: string): string {
  return input.trim();
}