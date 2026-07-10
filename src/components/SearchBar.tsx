"use client";

import { FormEvent, useState } from "react";
import { CoinFlipButton } from "@/components/CoinFlipButton";
import { normalizeAddress, safeParseSolanaAddress } from "@/lib/validation";

interface TryLuckConfig {
  disabled?: boolean;
  onPick: (mint: string) => void | Promise<void>;
}

interface SearchBarProps {
  onSearch: (address: string) => void;
  loading?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  compact?: boolean;
  tryLuck?: TryLuckConfig;
}

export function SearchBar({
  onSearch,
  loading = false,
  disabled = false,
  autoFocus = false,
  compact = false,
  tryLuck,
}: SearchBarProps) {
  const [value, setValue] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [luckError, setLuckError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const address = normalizeAddress(value);

    if (!address) {
      setClientError("Enter a Solana address");
      return;
    }

    const parsed = safeParseSolanaAddress(address);
    if (!parsed.success) {
      setClientError(parsed.error.errors[0]?.message ?? "Invalid address");
      return;
    }

    setClientError(null);
    setLuckError(null);
    onSearch(address);
  }

  const formError = clientError ?? luckError;

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full ${compact ? "max-w-none" : "max-w-2xl"}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <svg
              className="h-4 w-4 text-zen-cyan/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (clientError) setClientError(null);
            }}
            placeholder="Wallet or token mint address"
            autoFocus={autoFocus}
            disabled={loading || disabled}
            className="input-crypto pl-10"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="submit"
            disabled={loading || disabled}
            className="btn-primary min-w-0 flex-1 px-5 py-3 sm:flex-none sm:px-6 sm:py-2.5"
          >
            {loading ? "Searching…" : "Analyze"}
          </button>
          {tryLuck && (
            <CoinFlipButton
              disabled={tryLuck.disabled || loading || disabled}
              onPick={tryLuck.onPick}
              onError={setLuckError}
            />
          )}
        </div>
      </div>
      {formError && (
        <p className="mt-2 text-sm text-accent-red" role="alert">
          {formError}
        </p>
      )}
    </form>
  );
}