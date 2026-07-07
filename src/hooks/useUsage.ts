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

    const onSessionChange = () => refresh();
    window.addEventListener("wallet-session-changed", onSessionChange);
    return () =>
      window.removeEventListener("wallet-session-changed", onSessionChange);
  }, [refresh]);

  return { usage, setUsage, refresh };
}