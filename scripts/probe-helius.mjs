import { readFileSync, existsSync } from "node:fs";

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
}

loadEnv(".env.local");
const key = process.env.HELIUS_API_KEY;
const mint = process.argv[2] || "CFPkPq1eYPR8GLzEo59wUbbMioX4bshaTQiSGzTSpump";

async function rpc(method, params) {
  const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "1", method, params }),
  });
  return res.json();
}

for (const [method, params] of [
  ["getAsset", { id: mint }],
  ["getTokenAccounts", { mint, limit: 1, page: 1, options: { showZeroBalance: false } }],
  ["getTokenLargestAccounts", [mint]],
  ["getAccountInfo", [mint, { encoding: "jsonParsed" }]],
]) {
  console.log("\n===", method, "===");
  const data = await rpc(method, params);
  console.log(JSON.stringify(data, null, 2).slice(0, 3000));
}