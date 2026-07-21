function buildDatabaseUrl(): string | null {
  const host = process.env.MYSQL_HOST?.trim();
  const user = process.env.MYSQL_USER?.trim();
  const database = process.env.MYSQL_DATABASE?.trim();

  if (!host || !user || !database) {
    return process.env.DATABASE_URL?.trim() || null;
  }

  const password = process.env.MYSQL_PASSWORD ?? "";
  const port = process.env.MYSQL_PORT?.trim() || "3306";
  const ssl = process.env.MYSQL_SSL?.trim();
  const connectTimeout = process.env.MYSQL_CONNECT_TIMEOUT?.trim() || "10";

  const credentials = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
  let url = `mysql://${credentials}@${host}:${port}/${database}`;
  const params: string[] = [];

  if (ssl === "true" || ssl === "1") {
    const mode = process.env.MYSQL_SSL_ACCEPT?.trim() || "accept_invalid_certs";
    params.push(`sslaccept=${mode}`);
  }

  params.push(`connect_timeout=${connectTimeout}`);
  url += `?${params.join("&")}`;

  return url;
}

export function ensureDatabaseUrl(): string | null {
  const url = buildDatabaseUrl();
  if (!url) return null;
  process.env.DATABASE_URL = url;
  return url;
}