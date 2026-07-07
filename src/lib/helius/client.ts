import { HeliusError } from "./errors";
import type { JsonRpcResponse } from "./types";

const HELIUS_TIMEOUT_MS = 12_000;
const MAINNET_RPC = "https://mainnet.helius-rpc.com";

export function getHeliusApiKey(): string {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) {
    throw new HeliusError(
      "HELIUS_API_KEY is not configured",
      "NOT_CONFIGURED"
    );
  }
  return apiKey;
}

export function hasHeliusApiKey(): boolean {
  return Boolean(process.env.HELIUS_API_KEY);
}

function mapHttpStatus(status: number): HeliusError {
  if (status === 401 || status === 403) {
    return new HeliusError("Helius API key is invalid", "UNAUTHORIZED", {
      statusCode: status,
    });
  }
  if (status === 429) {
    return new HeliusError("Helius rate limit exceeded", "RATE_LIMIT", {
      statusCode: status,
    });
  }
  if (status === 504) {
    return new HeliusError("Helius request timed out", "TIMEOUT", {
      statusCode: status,
    });
  }
  return new HeliusError(`Helius HTTP error (${status})`, "HTTP_ERROR", {
    statusCode: status,
  });
}

function mapRpcError(error: { code: number; message: string }): HeliusError {
  if (error.code === -32005 || error.code === -32029) {
    return new HeliusError(error.message, "RATE_LIMIT", { rpcCode: error.code });
  }
  if (error.code === -32003) {
    return new HeliusError(error.message, "TIMEOUT", { rpcCode: error.code });
  }
  return new HeliusError(error.message, "RPC_ERROR", { rpcCode: error.code });
}

export async function heliusRpc<T>(
  method: string,
  params: unknown,
  id: string = method
): Promise<T> {
  const apiKey = getHeliusApiKey();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HELIUS_TIMEOUT_MS);

  try {
    const response = await fetch(`${MAINNET_RPC}/?api-key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id,
        method,
        params,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw mapHttpStatus(response.status);
    }

    const payload = (await response.json()) as JsonRpcResponse<T>;
    if (payload.error) {
      throw mapRpcError(payload.error);
    }

    if (payload.result === undefined) {
      throw new HeliusError(
        `Helius returned no result for ${method}`,
        "RPC_ERROR"
      );
    }

    return payload.result;
  } catch (error) {
    if (error instanceof HeliusError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new HeliusError("Helius request timed out", "TIMEOUT", {
        cause: error,
      });
    }
    throw new HeliusError("Helius request failed", "RPC_ERROR", {
      cause: error,
    });
  } finally {
    clearTimeout(timer);
  }
}