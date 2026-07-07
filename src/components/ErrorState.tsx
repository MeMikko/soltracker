import type { ApiError } from "@/lib/types";

interface ErrorStateProps {
  error: ApiError | { error: string };
  onRetry?: () => void;
  onUpgrade?: () => void;
}

const MESSAGES: Record<string, string> = {
  INVALID_ADDRESS: "The address format is invalid. Enter a valid Solana base58 address.",
  NOT_FOUND: "No on-chain account found for this address.",
  RATE_LIMIT:
    "You've used all 5 free searches for today on this wallet. Upgrade to Pro for unlimited access.",
  WALLET_REQUIRED:
    "Connect your Solana wallet and sign the login message to start searching.",
  IP_WALLET_LIMIT:
    "This network already used 2 wallets today. Reconnect a previous wallet or upgrade to Pro.",
  TIMEOUT: "The request timed out. Helius may be slow — try again.",
  INTERNAL: "Something went wrong. Please try again.",
};

export function ErrorState({ error, onRetry, onUpgrade }: ErrorStateProps) {
  const code = "code" in error ? error.code : "INTERNAL";
  const message = MESSAGES[code] ?? error.error;

  return (
    <div
      className="crypto-card mx-auto max-w-lg border-accent-red/20 p-6 text-center sm:p-8"
      role="alert"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-red/10">
        <svg
          className="h-6 w-6 text-accent-red"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-accent-red">Error</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-400">{message}</p>
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row sm:gap-3">
        {(code === "RATE_LIMIT" || code === "IP_WALLET_LIMIT") && onUpgrade && (
          <button type="button" onClick={onUpgrade} className="btn-primary">
            Upgrade to Pro
          </button>
        )}
        {onRetry && code !== "RATE_LIMIT" && (
          <button type="button" onClick={onRetry} className="btn-ghost">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}