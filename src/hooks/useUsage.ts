"use client";

import { useCallback, useEffect, useState } from "react";
import type { UsageResponse } from "@/lib/types";

export function useUsage() {
  const [usage, setUsage] = useState<UsageResponse | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/usage", { credentials: "include" });
      if (res.ok) {
        setUsage(await res.json());
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refresh();

    const onRefresh = () => refresh();
    window.addEventListener("wallet-session-changed", onRefresh);
    window.addEventListener("usage-changed", onRefresh);
    return () => {
      window.removeEventListener("wallet-session-changed", onRefresh);
      window.removeEventListener("usage-changed", onRefresh);
    };
  }, [refresh]);

  return { usage, setUsage, refresh };
}