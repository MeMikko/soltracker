"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchRecentTokens } from "@/lib/api-client";
import type { RecentToken } from "@/lib/types";

export function useRecentTokens(limit = 10) {
  const [tokens, setTokens] = useState<RecentToken[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setTokens(await fetchRecentTokens(limit));
    } catch {
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void refresh();

    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return { tokens, loading, refresh };
}