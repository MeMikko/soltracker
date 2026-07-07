import { ensureDatabaseUrl } from "./database-url";

export function hasDatabase(): boolean {
  return Boolean(ensureDatabaseUrl());
}

export function isDevFallback(): boolean {
  return !hasDatabase() || !process.env.HELIUS_API_KEY?.trim();
}