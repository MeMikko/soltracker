"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getRecentTokens,
  RECENT_TOKENS_CHANGED,
  type RecentToken,
} from "@/lib/recent-tokens";

export function useRecentTokens(wallet: string | null | undefined) {
  const [tokens, setTokens] = useState<RecentToken[]>([]);

  const refresh = useCallback(() => {
    setTokens(getRecentTokens(wallet));
  }, [wallet]);

  useEffect(() => {
    refresh();

    const onChange = () => refresh();
    window.addEventListener(RECENT_TOKENS_CHANGED, onChange);
    window.addEventListener("wallet-session-changed", onChange);

    return () => {
      window.removeEventListener(RECENT_TOKENS_CHANGED, onChange);
      window.removeEventListener("wallet-session-changed", onChange);
    };
  }, [refresh]);

  return { tokens, refresh };
}