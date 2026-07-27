import type { User } from "@/types/auth";

import { clearAccessToken, setAccessToken } from "./token-store";

/**
 * POST /auth/refresh, serialized. Refresh tokens are single-use and rotate on
 * every call (docs/auth.md), so two concurrent refreshes leave the loser with
 * a dead cookie and a false logout. One in-flight promise deduplicates calls
 * within the tab; a Web Lock serializes across tabs.
 *
 * Uses raw fetch, not apiFetch — apiFetch calls into this module on 401.
 */

interface RefreshData {
  user: User;
  accessToken: string;
}

let inFlight: Promise<User | null> | null = null;

/**
 * Refresh the session. Resolves with the user on success, null when the
 * session is genuinely over (cookie missing, revoked, or expired).
 */
export function refreshSession(): Promise<User | null> {
  inFlight ??= runExclusive().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function runExclusive(): Promise<User | null> {
  if (typeof navigator !== "undefined" && "locks" in navigator) {
    return await navigator.locks.request(
      "fashion-legacy-auth-refresh",
      doRefresh,
    );
  }
  return doRefresh();
}

async function doRefresh(): Promise<User | null> {
  try {
    const res = await fetch("/api/v1/auth/refresh", { method: "POST" });
    if (!res.ok) {
      clearAccessToken();
      return null;
    }
    const body = (await res.json()) as { data: RefreshData };
    setAccessToken(body.data.accessToken);
    return body.data.user;
  } catch {
    // Network failure, not a rejected session — keep local state; the
    // caller's own request will surface the error.
    return null;
  }
}
