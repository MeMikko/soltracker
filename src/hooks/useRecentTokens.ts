"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchTokenSearches } from "@/lib/api-client";
import type { RecentToken } from "@/lib/types";

export function useTokenSearches(
  limit = 6,
  sort: "popular" | "recent" = "popular"
) {
  const [tokens, setTokens] = useState<RecentToken[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchTokenSearches(limit, sort);
      setTokens(result.tokens);
      setTotal(result.total);
    } catch {
      setTokens([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [limit, sort]);

  useEffect(() => {
    void refresh();

    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return { tokens, total, loading, refresh };
}

/** @deprecated Use useTokenSearches */
export function useRecentTokens(limit = 10) {
  const { tokens, loading, refresh } = useTokenSearches(limit, "recent");
  return { tokens, loading, refresh };
}