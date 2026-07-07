import { ZodError } from "zod";
import { apiError } from "@/lib/api-errors";
import { WalletAuthRequiredError } from "@/lib/auth/errors";
import { IpWalletLimitError } from "@/lib/auth/ip-wallet-limit";
import { HeliusError } from "@/lib/helius/errors";
import { RateLimitExceededError } from "@/lib/rate-limit";

export function handleApiError(error: unknown) {
  if (error instanceof WalletAuthRequiredError) {
    return apiError(error.message, "WALLET_REQUIRED", 401);
  }

  if (error instanceof IpWalletLimitError) {
    return apiError(error.message, "IP_WALLET_LIMIT", 403);
  }

  if (error instanceof ZodError) {
    return apiError(
      "Invalid Solana address format",
      "INVALID_ADDRESS",
      400
    );
  }

  if (error instanceof RateLimitExceededError) {
    return apiError(
      "Daily search limit exceeded. Upgrade to Pro for unlimited searches.",
      "RATE_LIMIT",
      429
    );
  }

  if (error instanceof HeliusError) {
    switch (error.code) {
      case "NOT_FOUND":
        return apiError("Address not found on-chain", "NOT_FOUND", 404);
      case "TIMEOUT":
        return apiError(
          "Request timed out while fetching on-chain data. Please try again.",
          "TIMEOUT",
          504
        );
      case "RATE_LIMIT":
        return apiError(
          "Upstream rate limit exceeded. Please try again shortly.",
          "RATE_LIMIT",
          429
        );
      case "UNAUTHORIZED":
      case "NOT_CONFIGURED":
        return apiError(
          "On-chain data provider is not configured",
          "INTERNAL",
          500
        );
      default:
        return apiError(
          "Failed to fetch on-chain data",
          "INTERNAL",
          500
        );
    }
  }

  return apiError("An unexpected error occurred", "INTERNAL", 500);
}