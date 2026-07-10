"use client";

import { useCallback, useEffect, useState } from "react";
import { TokenSearchAvatar } from "@/components/TokenSearchAvatar";
import { truncateAddress } from "@/lib/format";
import type { ApiError, FeaturedTokenAdminSetting, TokenDetails } from "@/lib/types";

interface FeaturedTokenAdminResponse {
  setting: FeaturedTokenAdminSetting;
  preview: Pick<
    TokenDetails,
    "mint" | "name" | "symbol" | "imageUrl"
  > | null;
}

interface AdminFeaturedTokenPanelProps {
  isAdmin: boolean;
}

export function AdminFeaturedTokenPanel({ isAdmin }: AdminFeaturedTokenPanelProps) {
  const [setting, setSetting] = useState<FeaturedTokenAdminSetting | null>(null);
  const [preview, setPreview] = useState<FeaturedTokenAdminResponse["preview"]>(null);
  const [mintInput, setMintInput] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/featured-token", {
        credentials: "include",
      });
      const body = (await res.json()) as FeaturedTokenAdminResponse & ApiError;

      if (!res.ok) {
        setError(body.error ?? "Failed to load featured token settings");
        return;
      }

      setSetting(body.setting);
      setPreview(body.preview);
      setMintInput(body.setting.mint ?? "");
      setEnabled(body.setting.enabled);
    } catch {
      setError("Failed to load featured token settings");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/featured-token", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          mint: mintInput.trim() || undefined,
        }),
      });

      const body = (await res.json()) as FeaturedTokenAdminResponse & ApiError;

      if (!res.ok) {
        setError(body.error ?? "Failed to save featured token settings");
        return;
      }

      setSetting(body.setting);
      setPreview(body.preview);
      setMintInput(body.setting.mint ?? "");
      setEnabled(body.setting.enabled);
      setSuccess(
        body.setting.enabled
          ? "Featured token updated."
          : "Featured token hidden from the site."
      );
    } catch {
      setError("Failed to save featured token settings");
    } finally {
      setSaving(false);
    }
  }

  if (!isAdmin) return null;

  return (
    <section className="crypto-card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-label">Featured token</h2>
          <p className="mt-1 text-sm text-gray-500">
            Control the sponsored spotlight on the homepage and token results pages.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || saving}
          className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-50"
        >
          Reload
        </button>
      </div>

      <div className="space-y-4">
        <label className="flex items-center gap-3 rounded-xl border border-zen-border/60 bg-zen-card/40 px-4 py-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="h-4 w-4 rounded border-zen-border bg-zen-deep text-zen-cyan focus:ring-zen-cyan/30"
          />
          <span className="text-sm text-white">Show featured token on site</span>
        </label>

        <div>
          <label
            htmlFor="featured-mint"
            className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500"
          >
            Token mint
          </label>
          <input
            id="featured-mint"
            type="text"
            value={mintInput}
            onChange={(event) => setMintInput(event.target.value)}
            placeholder="Paste Solana token mint address"
            disabled={!enabled}
            className="w-full rounded-xl border border-zen-border/70 bg-zen-deep/80 px-4 py-3 font-mono text-sm text-white placeholder:text-gray-600 focus:border-zen-cyan/40 focus:outline-none focus:ring-1 focus:ring-zen-cyan/25 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {preview && enabled && (
          <div className="rounded-xl border border-zen-border/60 bg-zen-card/30 p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Preview
            </p>
            <div className="flex items-center gap-3">
              <TokenSearchAvatar
                symbol={preview.symbol}
                mint={preview.mint}
                imageUrl={preview.imageUrl}
                name={preview.name}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {preview.name ?? preview.symbol ?? truncateAddress(preview.mint, 4)}
                </p>
                <p className="font-mono text-[10px] text-gray-600">
                  {truncateAddress(preview.mint, 8)}
                </p>
              </div>
            </div>
          </div>
        )}

        {setting && (
          <p className="text-[10px] text-gray-600">
            Last updated{" "}
            {new Date(setting.updatedAt).toLocaleString()}
            {setting.updatedBy
              ? ` by ${truncateAddress(setting.updatedBy, 6)}`
              : ""}
          </p>
        )}

        {error && (
          <p className="rounded-lg border border-accent-red/25 bg-accent-red/10 px-3 py-2 text-xs text-accent-red">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-lg border border-zen-sage/25 bg-zen-sage/10 px-3 py-2 text-xs text-zen-sage">
            {success}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || loading || (enabled && !mintInput.trim())}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save featured token"}
        </button>
      </div>
    </section>
  );
}