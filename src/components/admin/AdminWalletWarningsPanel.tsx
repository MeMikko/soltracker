"use client";

import { useCallback, useEffect, useState } from "react";
import { truncateAddress } from "@/lib/format";
import type { ApiError, WalletWarningEntry } from "@/lib/types";

interface AdminWalletWarningsPanelProps {
  isAdmin: boolean;
}

export function AdminWalletWarningsPanel({
  isAdmin,
}: AdminWalletWarningsPanelProps) {
  const [warnings, setWarnings] = useState<WalletWarningEntry[]>([]);
  const [walletInput, setWalletInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/wallet-warnings", {
        credentials: "include",
      });
      const body = (await res.json()) as { warnings: WalletWarningEntry[] } & ApiError;

      if (!res.ok) {
        setError(body.error ?? "Failed to load wallet warnings");
        return;
      }

      setWarnings(body.warnings);
    } catch {
      setError("Failed to load wallet warnings");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/wallet-warnings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: walletInput.trim(),
          note: noteInput.trim() || undefined,
        }),
      });

      const body = (await res.json()) as ApiError;

      if (!res.ok) {
        setError(body.error ?? "Failed to add wallet warning");
        return;
      }

      setWalletInput("");
      setNoteInput("");
      setSuccess("Wallet added to warning list.");
      await load();
    } catch {
      setError("Failed to add wallet warning");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(wallet: string) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/wallet-warnings", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });

      const body = (await res.json()) as ApiError;

      if (!res.ok) {
        setError(body.error ?? "Failed to remove wallet warning");
        return;
      }

      setSuccess("Wallet removed from warning list.");
      await load();
    } catch {
      setError("Failed to remove wallet warning");
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) return null;

  return (
    <section className="crypto-card p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="section-label">Wallet warning list</h2>
        <p className="mt-1 text-sm text-gray-500">
          Flag deployer wallets that have rugged before. Token searches will
          show a warning when the creator matches.
        </p>
      </div>

      <form onSubmit={(event) => void handleAdd(event)} className="space-y-3">
        <div>
          <label
            htmlFor="warning-wallet"
            className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500"
          >
            Wallet address
          </label>
          <input
            id="warning-wallet"
            type="text"
            value={walletInput}
            onChange={(event) => setWalletInput(event.target.value)}
            placeholder="Paste deployer wallet address"
            className="w-full rounded-xl border border-zen-border/70 bg-zen-deep/80 px-4 py-3 font-mono text-sm text-white placeholder:text-gray-600 focus:border-accent-red/40 focus:outline-none focus:ring-1 focus:ring-accent-red/25"
          />
        </div>

        <div>
          <label
            htmlFor="warning-note"
            className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500"
          >
            Note (optional)
          </label>
          <textarea
            id="warning-note"
            value={noteInput}
            onChange={(event) => setNoteInput(event.target.value)}
            placeholder="e.g. Rugged 3 pump tokens in March 2026"
            rows={3}
            className="w-full rounded-xl border border-zen-border/70 bg-zen-deep/80 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-accent-red/40 focus:outline-none focus:ring-1 focus:ring-accent-red/25"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !walletInput.trim()}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Add to warning list"}
        </button>
      </form>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Flagged wallets ({warnings.length})
          </p>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading || saving}
            className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Reload
          </button>
        </div>

        {loading && warnings.length === 0 ? (
          <p className="text-sm text-gray-500">Loading warnings…</p>
        ) : warnings.length === 0 ? (
          <p className="rounded-xl border border-zen-border/50 bg-zen-card/30 px-4 py-3 text-sm text-gray-500">
            No flagged wallets yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {warnings.map((warning) => (
              <li
                key={warning.wallet}
                className="rounded-xl border border-accent-red/20 bg-zen-card/30 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-white">
                      {truncateAddress(warning.wallet, 8)}
                    </p>
                    {warning.note && (
                      <p className="mt-1 text-xs leading-relaxed text-gray-400">
                        {warning.note}
                      </p>
                    )}
                    <p className="mt-2 text-[10px] text-gray-600">
                      Added {new Date(warning.addedAt).toLocaleString()} by{" "}
                      {truncateAddress(warning.addedBy, 6)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemove(warning.wallet)}
                    disabled={saving}
                    className="btn-ghost px-3 py-1.5 text-xs text-accent-red disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-accent-red/25 bg-accent-red/10 px-3 py-2 text-xs text-accent-red">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 rounded-lg border border-zen-sage/25 bg-zen-sage/10 px-3 py-2 text-xs text-zen-sage">
          {success}
        </p>
      )}
    </section>
  );
}