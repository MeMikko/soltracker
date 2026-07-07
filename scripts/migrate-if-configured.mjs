import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function hasDatabaseConfig() {
  if (process.env.DATABASE_URL?.trim()) {
    return true;
  }

  return Boolean(
    process.env.MYSQL_HOST?.trim() &&
      process.env.MYSQL_USER?.trim() &&
      process.env.MYSQL_DATABASE?.trim()
  );
}

loadEnvFile(".env");
loadEnvFile(".env.local");

if (!hasDatabaseConfig()) {
  console.log("[migrate] skipped — no database configured");
  process.exit(0);
}

console.log("[migrate] applying prisma migrations");
execSync("npx prisma migrate deploy", { stdio: "inherit" });