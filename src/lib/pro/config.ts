/** Treasury wallet for Pro subscriptions (same as admin wallet by default). */
export const PRO_TREASURY_WALLET =
  process.env.PRO_TREASURY_WALLET?.trim() ||
  "6fRPW1DWahcznCxzjg8V89FWP1fQ3y4tmkgzwzocjSzb";

/** 0.25 SOL per month */
export const PRO_PRICE_LAMPORTS = 250_000_000;

export const PRO_PRICE_SOL = 0.25;

export const PRO_PERIOD_DAYS = 30;