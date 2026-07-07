export type HeliusErrorCode =
  | "NOT_CONFIGURED"
  | "NOT_FOUND"
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "UNAUTHORIZED"
  | "RPC_ERROR"
  | "HTTP_ERROR";

export class HeliusError extends Error {
  readonly code: HeliusErrorCode;
  readonly statusCode?: number;
  readonly rpcCode?: number;

  constructor(
    message: string,
    code: HeliusErrorCode,
    options?: { statusCode?: number; rpcCode?: number; cause?: unknown }
  ) {
    super(message, { cause: options?.cause });
    this.name = "HeliusError";
    this.code = code;
    this.statusCode = options?.statusCode;
    this.rpcCode = options?.rpcCode;
  }
}

export function isHeliusError(error: unknown): error is HeliusError {
  return error instanceof HeliusError;
}