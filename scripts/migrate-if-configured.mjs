import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const INITIAL_MIGRATION = "20260707200000_init_mysql";
/** Fail fast on Vercel instead of hanging until the build is killed with no logs. */
const MIGRATE_TIMEOUT_MS = Number(process.env.MIGRATE_TIMEOUT_MS || 45_000);

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

    // Never overwrite platform/CI env (e.g. Vercel dashboard secrets).
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

function truthy(value) {
  return ["1", "true", "yes", "on"].includes(String(value ?? "").trim().toLowerCase());
}

function describeTarget() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    try {
      const parsed = new URL(url);
      return {
        host: parsed.hostname || "(unknown)",
        port: parsed.port || "3306",
        user: decodeURIComponent(parsed.username || "") || "(none)",
        database: (parsed.pathname || "/").replace(/^\//, "") || "(none)",
        passwordSet: Boolean(parsed.password),
      };
    } catch {
      return { host: "(invalid DATABASE_URL)", port: "?", user: "?", database: "?", passwordSet: false };
    }
  }

  return {
    host: process.env.MYSQL_HOST?.trim() || "(none)",
    port: process.env.MYSQL_PORT?.trim() || "3306",
    user: process.env.MYSQL_USER?.trim() || "(none)",
    database: process.env.MYSQL_DATABASE?.trim() || "(none)",
    passwordSet: Boolean(process.env.MYSQL_PASSWORD),
  };
}

function run(command) {
  execSync(command, { stdio: "inherit", timeout: MIGRATE_TIMEOUT_MS });
}

function runCapture(command) {
  try {
    const output = execSync(command, {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      timeout: MIGRATE_TIMEOUT_MS,
    });
    return { ok: true, output };
  } catch (error) {
    const timedOut = error.killed && error.signal === "SIGTERM";
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    return {
      ok: false,
      output,
      status: error.status ?? 1,
      timedOut: timedOut || error.code === "ETIMEDOUT",
    };
  }
}

function printConnectionHelp(reason) {
  console.error(`[migrate] ${reason}`);
  console.error(
    "[migrate] Vercel build machines must reach your MySQL host on port 3306."
  );
  console.error(
    "[migrate] Fix: allow remote MySQL / whitelist Vercel (or use a public DB host), verify MYSQL_* on Vercel Production,"
  );
  console.error(
    "[migrate] or set SKIP_DB_MIGRATE=1 on Vercel to ship the app without running migrations during build."
  );
}

loadEnvFile(".env");
loadEnvFile(".env.local");

if (truthy(process.env.SKIP_DB_MIGRATE)) {
  console.log("[migrate] skipped — SKIP_DB_MIGRATE is set");
  process.exit(0);
}

if (!hasDatabaseConfig()) {
  console.log("[migrate] skipped — no database configured");
  process.exit(0);
}

const target = describeTarget();
console.log(
  `[migrate] target ${target.user}@${target.host}:${target.port}/${target.database} (password ${target.passwordSet ? "set" : "MISSING"})`
);
console.log(
  `[migrate] applying prisma migrations (timeout ${MIGRATE_TIMEOUT_MS}ms)`
);

const deploy = runCapture("npx prisma migrate deploy");

if (deploy.ok) {
  console.log("[migrate] migrations applied");
  process.exit(0);
}

if (deploy.timedOut) {
  printConnectionHelp(
    `timed out after ${MIGRATE_TIMEOUT_MS}ms — database did not respond (firewall / host unreachable is common on Vercel).`
  );
  process.exit(1);
}

if (deploy.output.includes("P3005")) {
  console.log(
    "[migrate] database already has tables — baselining migration history"
  );
  try {
    run(`npx prisma migrate resolve --applied ${INITIAL_MIGRATION}`);
    run("npx prisma migrate deploy");
    console.log("[migrate] migrations applied after baseline");
    process.exit(0);
  } catch (error) {
    console.error(error.stdout ?? error.stderr ?? error.message);
    process.exit(error.status ?? 1);
  }
}

if (
  deploy.output.includes("P1000") ||
  deploy.output.includes("P1001") ||
  deploy.output.includes("P1011") ||
  deploy.output.includes("P1002") ||
  deploy.output.includes("Authentication failed") ||
  deploy.output.includes("Can't reach database")
) {
  if (!target.passwordSet) {
    printConnectionHelp(
      "auth/connection failed and MYSQL_PASSWORD / DATABASE_URL password is missing in this environment."
    );
  } else {
    printConnectionHelp(
      "auth/connection failed — check MYSQL_PASSWORD, host allowlist, and that Production env vars are set on Vercel."
    );
  }
}

if (deploy.output.trim()) {
  console.error(deploy.output);
} else {
  console.error("[migrate] prisma migrate deploy failed with no output");
}

process.exit(deploy.status ?? 1);
