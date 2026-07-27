import { refreshSession } from "@/lib/auth/refresh";
import { clearAccessToken, getAccessToken } from "@/lib/auth/token-store";
import type { ApiErrorBody, ValidationIssue } from "@/types/auth";

/**
 * Single door for every backend call. Requests go to the relative /api/v1
 * path; the rewrite in next.config.ts proxies them to the Express API, so
 * everything is same-origin and the refresh cookie needs no extra handling.
 *
 * Success responses unwrap to their `data` payload. Failures throw ApiError
 * carrying the HTTP status, the backend's machine-readable `code`, and
 * validation messages keyed by form field.
 *
 * A 401 triggers one transparent refresh + retry (docs/auth.md client
 * contract). If the refresh also fails, the session is over: the token store
 * is cleared and an ApiError with code SESSION_EXPIRED is thrown.
 */

const API_BASE = "/api/v1";

/** Client-side code for "refresh failed, go to login" — never sent by the backend. */
export const SESSION_EXPIRED = "SESSION_EXPIRED";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  /** Validation messages keyed by field name ("email", "newPassword", …). */
  readonly fieldErrors?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    extra: { code?: string; fieldErrors?: Record<string, string[]> } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = extra.code;
    this.fieldErrors = extra.fieldErrors;
  }
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** JSON-serialized, unless it is FormData (file uploads). */
  body?: unknown;
  /**
   * Skip the 401 → refresh → retry dance. Only for endpoints where a 401
   * means "bad credentials" rather than "expired access token" (login).
   */
  skipAuthRefresh?: boolean;
  signal?: AbortSignal;
}

export async function apiFetch<T = void>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  return attempt<T>(path, options, false);
}

async function attempt<T>(
  path: string,
  options: ApiFetchOptions,
  isRetry: boolean,
): Promise<T> {
  const { method = "GET", body, skipAuthRefresh = false, signal } = options;

  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: payload,
    signal,
  });

  if (res.status === 401 && !skipAuthRefresh && !isRetry) {
    const user = await refreshSession();
    if (user) return attempt<T>(path, options, true);
    clearAccessToken();
    throw new ApiError(401, "Your session has expired. Please log in again.", {
      code: SESSION_EXPIRED,
    });
  }

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // Empty or non-JSON body (e.g. the proxy target is down).
  }

  if (!res.ok) {
    const errBody = (json ?? {}) as Partial<ApiErrorBody>;
    throw new ApiError(
      res.status,
      errBody.message ?? `Request failed with status ${res.status}`,
      { code: errBody.code, fieldErrors: toFieldErrors(errBody.errors) },
    );
  }

  return (json as { data?: T } | null)?.data as T;
}

function toFieldErrors(
  issues?: ValidationIssue[],
): Record<string, string[]> | undefined {
  if (!issues?.length) return undefined;
  const fields: Record<string, string[]> = {};
  for (const issue of issues) {
    // Backend schemas are wrapped as z.object({ body: ... }), so the first
    // path segment is "body" — strip it to get the form field name.
    const path = issue.path[0] === "body" ? issue.path.slice(1) : issue.path;
    const key = path.join(".") || "_form";
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}
