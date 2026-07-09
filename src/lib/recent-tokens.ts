export interface RecentToken {
  mint: string;
  name: string | null;
  symbol: string | null;
  imageUrl: string | null;
  viewedAt: number;
}

const STORAGE_PREFIX = "zenerating_recent_tokens";
const MAX_RECENT = 10;

export const RECENT_TOKENS_CHANGED = "recent-tokens-changed";

function storageKey(wallet: string | null | undefined): string {
  return wallet ? `${STORAGE_PREFIX}:${wallet}` : `${STORAGE_PREFIX}:anonymous`;
}

export function getRecentTokens(
  wallet: string | null | undefined
): RecentToken[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(storageKey(wallet));
    if (!raw) return [];

    const parsed = JSON.parse(raw) as RecentToken[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry) =>
          typeof entry.mint === "string" &&
          typeof entry.viewedAt === "number"
      )
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function addRecentToken(
  token: Omit<RecentToken, "viewedAt">,
  wallet: string | null | undefined
): void {
  if (typeof window === "undefined") return;

  const entry: RecentToken = {
    ...token,
    viewedAt: Date.now(),
  };

  const existing = getRecentTokens(wallet).filter(
    (item) => item.mint !== entry.mint
  );

  const next = [entry, ...existing].slice(0, MAX_RECENT);

  try {
    localStorage.setItem(storageKey(wallet), JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(RECENT_TOKENS_CHANGED));
  } catch {
    // localStorage full or unavailable
  }
}