import { existsSync, readFileSync, writeFileSync } from "node:fs";
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

    process.env[key] = value;
  }
}

function upsertEnvValue(filename, key, value) {
  const path = resolve(process.cwd(), filename);
  const line = `${key}="${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  let content = existsSync(path) ? readFileSync(path, "utf8") : "";

  const regex = new RegExp(`^${key}=.*$`, "m");
  content = regex.test(content)
    ? content.replace(regex, line)
    : `${content}${content.endsWith("\n") || content.length === 0 ? "" : "\n"}${line}\n`;

  writeFileSync(path, content, "utf8");
}

function buildDatabaseUrl() {
  const host = process.env.MYSQL_HOST?.trim();
  const user = process.env.MYSQL_USER?.trim();
  const database = process.env.MYSQL_DATABASE?.trim();

  if (!host || !user || !database) {
    return process.env.DATABASE_URL?.trim() || null;
  }

  const password = process.env.MYSQL_PASSWORD ?? "";
  const port = process.env.MYSQL_PORT?.trim() || "3306";
  const ssl = process.env.MYSQL_SSL?.trim();

  const credentials = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
  let url = `mysql://${credentials}@${host}:${port}/${database}`;

  if (ssl === "true" || ssl === "1") {
    const mode = process.env.MYSQL_SSL_ACCEPT?.trim() || "accept_invalid_certs";
    url += `?sslaccept=${mode}`;
  }

  return url;
}

// .env.local overrides .env so MYSQL_* edits always win.
loadEnvFile(".env");
loadEnvFile(".env.local");

const databaseUrl = buildDatabaseUrl();
if (!databaseUrl) {
  process.exit(0);
}

upsertEnvValue(".env", "DATABASE_URL", databaseUrl);
process.env.DATABASE_URL = databaseUrl;