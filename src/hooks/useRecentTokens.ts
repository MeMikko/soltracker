"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTokenSearches } from "@/lib/api-client";
import type { RecentToken } from "@/lib/types";

const CACHE_KEY = "zenerating:token-searches:popular";

interface CachedPreview {
  tokens: RecentToken[];
  total: number;
}

function readCachedPreview(): CachedPreview | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedPreview;
    if (!Array.isArray(parsed.tokens)) return null;

    return parsed;
  } catch {
    return null;
  }
}

function writeCachedPreview(tokens: RecentToken[], total: number): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ tokens, total }));
  } catch {
    // sessionStorage full or unavailable
  }
}

function getInitialState() {
  const cached = readCachedPreview();
  return {
    tokens: cached?.tokens ?? [],
    total: cached?.total ?? 0,
    loading: !cached,
  };
}

export function useTokenSearches(
  limit = 6,
  sort: "popular" | "recent" = "popular"
) {
  const initialState = useRef(getInitialState()).current;
  const [tokens, setTokens] = useState<RecentToken[]>(initialState.tokens);
  const [total, setTotal] = useState(initialState.total);
  const [loading, setLoading] = useState(initialState.loading);
  const hasTokensRef = useRef(initialState.tokens.length > 0);

  const refresh = useCallback(
    async (silent = false) => {
      if (!silent && !hasTokensRef.current) {
        setLoading(true);
      }

      try {
        const result = await fetchTokenSearches(limit, sort);
        setTokens(result.tokens);
        setTotal(result.total);
        hasTokensRef.current = result.tokens.length > 0;

        if (sort === "popular") {
          writeCachedPreview(result.tokens, result.total);
        }
      } catch {
        if (!silent) {
          setTokens([]);
          setTotal(0);
          hasTokensRef.current = false;
        }
      } finally {
        setLoading(false);
      }
    },
    [limit, sort]
  );

  useEffect(() => {
    void refresh(initialState.tokens.length > 0);

    const onFocus = () => void refresh(true);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh, initialState.tokens.length]);

  return { tokens, total, loading, refresh };
}

/** @deprecated Use useTokenSearches */
export function useRecentTokens(limit = 10) {
  const { tokens, loading, refresh } = useTokenSearches(limit, "recent");
  return { tokens, loading, refresh };
}