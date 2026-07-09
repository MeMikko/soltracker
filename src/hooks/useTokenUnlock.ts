"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchTokenUnlockStatus } from "@/lib/api-client";
import type { TokenUnlockStatus } from "@/lib/types";

export function useTokenUnlock(mint: string | null | undefined) {
  const [status, setStatus] = useState<TokenUnlockStatus>({
    unlocked: false,
    expiresAt: null,
    via: null,
  });
  const [loading, setLoading] = useState(Boolean(mint));

  const refresh = useCallback(async () => {
    if (!mint) {
      setStatus({ unlocked: false, expiresAt: null, via: null });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setStatus(await fetchTokenUnlockStatus(mint));
    } catch {
      setStatus({ unlocked: false, expiresAt: null, via: null });
    } finally {
      setLoading(false);
    }
  }, [mint]);

  useEffect(() => {
    void refresh();

    const onChange = () => void refresh();
    window.addEventListener("token-unlock-changed", onChange);
    return () => window.removeEventListener("token-unlock-changed", onChange);
  }, [refresh]);

  return {
    unlocked: status.unlocked,
    expiresAt: status.expiresAt,
    via: status.via,
    loading,
    refresh,
  };
}