import { getGmgnTradeUrl } from "@/lib/gmgn";

export const FEATURED_TOKEN_MINT =
  "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";

export const FEATURED_TOKEN = {
  mint: FEATURED_TOKEN_MINT,
  href: getGmgnTradeUrl(FEATURED_TOKEN_MINT),
} as const;