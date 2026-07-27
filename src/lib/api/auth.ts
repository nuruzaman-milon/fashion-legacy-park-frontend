import { clearAccessToken, setAccessToken } from "@/lib/auth/token-store";
import type { SessionInfo, User } from "@/types/auth";

import { apiFetch } from "./client";

/**
 * Auth API surface (docs/auth.md). Responses that carry an access token feed
 * the token store here, and flows that kill the session server-side
 * (change/reset password, logout) clear it — callers only deal with User.
 */

interface AuthPayload {
  user: User;
  accessToken: string;
}

// ---------------------------------------------------------------- signup

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

/** Creates the account. Returns no tokens — the user must verify first. */
export function register(input: RegisterInput): Promise<User> {
  return apiFetch<User>("/auth/register", { method: "POST", body: input });
}

/** Consumes the single-use token from the verification email. */
export function verifyEmail(token: string): Promise<User> {
  return apiFetch<User>("/auth/verify-email", {
    method: "POST",
    body: { token },
  });
}

/** Always resolves, whether or not the email exists (anti-enumeration). */
export async function resendVerification(email: string): Promise<void> {
  await apiFetch("/auth/resend-verification", {
    method: "POST",
    body: { email },
  });
}

// ---------------------------------------------------------------- session

export async function login(email: string, password: string): Promise<User> {
  const data = await apiFetch<AuthPayload>("/auth/login", {
    method: "POST",
    body: { email, password },
    // A 401 here means bad credentials, not an expired session.
    skipAuthRefresh: true,
  });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } finally {
    clearAccessToken();
  }
}

/** Logs out every device. Other devices' access tokens live up to 15 more minutes. */
export async function logoutAll(): Promise<void> {
  try {
    await apiFetch("/auth/logout-all", { method: "POST" });
  } finally {
    clearAccessToken();
  }
}

// ---------------------------------------------------------------- passwords

/** Always resolves, whether or not the email exists (anti-enumeration). */
export async function forgotPassword(email: string): Promise<void> {
  await apiFetch("/auth/forgot-password", { method: "POST", body: { email } });
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<void> {
  await apiFetch("/auth/reset-password", {
    method: "POST",
    body: { token, password },
  });
  // Reset revokes every session — including this browser's, if it had one.
  clearAccessToken();
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiFetch("/auth/change-password", {
    method: "POST",
    body: { currentPassword, newPassword },
  });
  // Success kills every token, including the one that made this request
  // (docs/auth.md) — the caller must route back to login.
  clearAccessToken();
}

// ---------------------------------------------------------------- profile

export function getMe(): Promise<User> {
  return apiFetch<User>("/auth/me");
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
}

export function updateProfile(input: UpdateProfileInput): Promise<User> {
  return apiFetch<User>("/auth/me", { method: "PATCH", body: input });
}

/** Sends a confirmation link to the new address; email changes only on confirm. */
export async function changeEmail(
  newEmail: string,
  password: string,
): Promise<void> {
  await apiFetch("/auth/change-email", {
    method: "POST",
    body: { newEmail, password },
  });
}

/** Consumes the token from the /confirm-email-change link. */
export function verifyNewEmail(token: string): Promise<User> {
  return apiFetch<User>("/auth/verify-new-email", {
    method: "POST",
    body: { token },
  });
}

// ---------------------------------------------------------------- devices

export function getSessions(): Promise<SessionInfo[]> {
  return apiFetch<SessionInfo[]>("/auth/sessions");
}

export async function revokeSession(id: string): Promise<void> {
  await apiFetch(`/auth/sessions/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------- avatar

export function uploadAvatar(file: File): Promise<User> {
  const form = new FormData();
  form.append("avatar", file);
  return apiFetch<User>("/auth/me/avatar", { method: "POST", body: form });
}

export function removeAvatar(): Promise<User> {
  return apiFetch<User>("/auth/me/avatar", { method: "DELETE" });
}
