import type { ClusterGraph } from "@/lib/clustering/types";
import type { TokenAnalytics } from "@/lib/data/token-analytics-service";
import type {
  ApiError,
  RecentToken,
  RiskResponse,
  SearchResponse,
  TokenDetails,
  UsageResponse,
  WalletDetails,
} from "./types";

const fetchOptions: RequestInit = { credentials: "include" };

type ApiSuccess<T> = { ok: true; data: T; usage: UsageResponse | null };
type ApiFailure = { ok: false; error: ApiError; status: number };

async function parseJson<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

function extractUsage<T extends { usage?: UsageResponse }>(
  body: T
): { data: Omit<T, "usage">; usage: UsageResponse | null } {
  const { usage, ...data } = body;
  return { data: data as Omit<T, "usage">, usage: usage ?? null };
}

export async function fetchRecentTokens(
  limit = 10
): Promise<RecentToken[]> {
  const res = await fetch(`/api/tokens/recent?limit=${limit}`, fetchOptions);
  if (!res.ok) return [];

  const body = (await parseJson<{ tokens?: RecentToken[] }>(res)) as {
    tokens?: RecentToken[];
  };
  return body.tokens ?? [];
}

export async function fetchUsage(): Promise<UsageResponse> {
  const res = await fetch("/api/usage", fetchOptions);
  return parseJson<UsageResponse>(res);
}

export interface ProActivationResult {
  pro: { active: boolean; expiresAt: string | null };
  usage: UsageResponse;
}

export async function activateProPayment(
  signature: string
): Promise<ApiSuccess<ProActivationResult> | ApiFailure> {
  const res = await fetch("/api/pro/activate", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signature }),
  });

  const body = await parseJson<ProActivationResult & ApiError>(res);

  if (!res.ok) {
    return { ok: false, error: body, status: res.status };
  }

  return { ok: true, data: body, usage: body.usage };
}

export async function searchAddress(
  address: string
): Promise<ApiSuccess<SearchResponse> | ApiFailure> {
  const res = await fetch(
    `/api/search/${encodeURIComponent(address)}`,
    fetchOptions
  );
  const body = await parseJson<
    SearchResponse & { usage: UsageResponse } & ApiError
  >(res);

  if (!res.ok) {
    return { ok: false, error: body, status: res.status };
  }

  const { data, usage } = extractUsage(body);
  return { ok: true, data, usage };
}

export async function fetchRisk(
  type: string,
  address: string
): Promise<ApiSuccess<RiskResponse> | ApiFailure> {
  const res = await fetch(
    `/api/risk/${type}/${encodeURIComponent(address)}`,
    fetchOptions
  );
  const body = await parseJson<RiskResponse & ApiError>(res);

  if (!res.ok) {
    return { ok: false, error: body, status: res.status };
  }

  const { data, usage } = extractUsage(body);
  return { ok: true, data, usage };
}

export async function fetchWallet(
  address: string
): Promise<ApiSuccess<WalletDetails> | ApiFailure> {
  const res = await fetch(
    `/api/wallet/${encodeURIComponent(address)}`,
    fetchOptions
  );
  const body = await parseJson<WalletDetails & { usage?: UsageResponse } & ApiError>(
    res
  );

  if (!res.ok) {
    return { ok: false, error: body, status: res.status };
  }

  const { data, usage } = extractUsage(body);
  return { ok: true, data, usage };
}

export async function fetchTokenAnalytics(
  mint: string
): Promise<ApiSuccess<TokenAnalytics> | ApiFailure> {
  const res = await fetch(
    `/api/token/${encodeURIComponent(mint)}/analytics`,
    fetchOptions
  );
  const body = await parseJson<
    TokenAnalytics & { usage?: UsageResponse; source?: string } & ApiError
  >(res);

  if (!res.ok) {
    return { ok: false, error: body, status: res.status };
  }

  const { data, usage } = extractUsage(body);
  return { ok: true, data, usage };
}

export async function fetchToken(
  mint: string
): Promise<ApiSuccess<TokenDetails> | ApiFailure> {
  const res = await fetch(
    `/api/token/${encodeURIComponent(mint)}`,
    fetchOptions
  );
  const body = await parseJson<TokenDetails & { usage?: UsageResponse } & ApiError>(
    res
  );

  if (!res.ok) {
    return { ok: false, error: body, status: res.status };
  }

  const { data, usage } = extractUsage(body);
  return { ok: true, data, usage };
}

export async function fetchCluster(
  address: string
): Promise<ApiSuccess<ClusterGraph> | ApiFailure> {
  const res = await fetch(
    `/api/clustering/${encodeURIComponent(address)}`,
    fetchOptions
  );
  const body = await parseJson<
    ClusterGraph & { usage?: UsageResponse; source?: string } & ApiError
  >(res);

  if (!res.ok) {
    return { ok: false, error: body, status: res.status };
  }

  const { data, usage } = extractUsage(body);
  return { ok: true, data, usage };
}

export async function fetchTokenCreatorCluster(
  mint: string
): Promise<ApiSuccess<ClusterGraph> | ApiFailure> {
  const res = await fetch(
    `/api/clustering/token/${encodeURIComponent(mint)}`,
    fetchOptions
  );
  const body = await parseJson<
    ClusterGraph & { usage?: UsageResponse; source?: string } & ApiError
  >(res);

  if (!res.ok) {
    return { ok: false, error: body, status: res.status };
  }

  const { data, usage } = extractUsage(body);
  return { ok: true, data, usage };
}