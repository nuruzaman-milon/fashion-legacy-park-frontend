"use client";

import * as React from "react";

import { getMe, login as apiLogin, logout as apiLogout } from "@/lib/api/auth";
import { refreshSession } from "@/lib/auth/refresh";
import {
  getAccessToken,
  onTokenChange,
  setAccessToken,
} from "@/lib/auth/token-store";
import type { User } from "@/types/auth";

/**
 * Session state for the whole app. The access token itself stays in the token
 * store; this provider owns the user object and the loading/authenticated/
 * anonymous status the UI renders from.
 *
 * Bootstrap: one POST /refresh on mount restores the session after a reload —
 * the httpOnly refresh cookie is the source of truth, memory is just a cache.
 */

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  /** Re-fetch /me and update context (e.g. after a profile edit). */
  refreshUser: () => Promise<void>;
  /** Push an already-fetched user into context (e.g. from a verify flow). */
  setUser: (user: User) => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

type SyncMessage =
  | { type: "login"; user: User; accessToken: string }
  | { type: "logout" };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthStatus>("loading");
  const [user, setUserState] = React.useState<User | null>(null);
  const channelRef = React.useRef<BroadcastChannel | null>(null);

  const applyUser = React.useCallback((next: User | null) => {
    setUserState(next);
    setStatus(next ? "authenticated" : "anonymous");
  }, []);

  const bootstrapped = React.useRef(false);
  React.useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void refreshSession().then(applyUser);
  }, [applyUser]);

  // The token store empties when a refresh fails mid-session or a flow kills
  // the session server-side (change/reset password) — flip to anonymous.
  React.useEffect(() => {
    return onTokenChange((token) => {
      if (!token) applyUser(null);
    });
  }, [applyUser]);

  // Keep other open tabs in sync so they neither sit on a dead session after
  // a logout here, nor stay logged out after a login here.
  React.useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel("fashion-legacy-auth");
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const msg = event.data;
      if (msg.type === "logout") {
        setAccessToken(null);
      } else {
        setAccessToken(msg.accessToken);
        applyUser(msg.user);
      }
    };
    return () => {
      channelRef.current = null;
      channel.close();
    };
  }, [applyUser]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      const loggedIn = await apiLogin(email, password);
      applyUser(loggedIn);
      const accessToken = getAccessToken();
      if (accessToken) {
        channelRef.current?.postMessage({
          type: "login",
          user: loggedIn,
          accessToken,
        } satisfies SyncMessage);
      }
      return loggedIn;
    },
    [applyUser],
  );

  const logout = React.useCallback(async () => {
    // apiLogout clears the token store, which flips status via onTokenChange.
    await apiLogout();
    channelRef.current?.postMessage({ type: "logout" } satisfies SyncMessage);
  }, []);

  const refreshUser = React.useCallback(async () => {
    applyUser(await getMe());
  }, [applyUser]);

  const setUser = React.useCallback(
    (next: User) => applyUser(next),
    [applyUser],
  );

  const value = React.useMemo(
    () => ({ status, user, login, logout, refreshUser, setUser }),
    [status, user, login, logout, refreshUser, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
