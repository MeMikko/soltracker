import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const INITIAL_MIGRATION = "20260707200000_init_mysql";

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

function run(command) {
  execSync(command, { stdio: "inherit" });
}

function runCapture(command) {
  try {
    const output = execSync(command, {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    });
    return { ok: true, output };
  } catch (error) {
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    return { ok: false, output, status: error.status ?? 1 };
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

if (!hasDatabaseConfig()) {
  console.log("[migrate] skipped — no database configured");
  process.exit(0);
}

console.log("[migrate] applying prisma migrations");
const deploy = runCapture("npx prisma migrate deploy");

if (deploy.ok) {
  process.exit(0);
}

if (deploy.output.includes("P3005")) {
  console.log(
    "[migrate] database already has tables — baselining migration history"
  );
  run(`npx prisma migrate resolve --applied ${INITIAL_MIGRATION}`);
  run("npx prisma migrate deploy");
  process.exit(0);
}

console.error(deploy.output);
process.exit(deploy.status ?? 1);