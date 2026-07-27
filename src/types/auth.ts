/**
 * Shapes returned by the auth API — kept in sync with docs/auth.md.
 */

export type Role = "SUPER_ADMIN" | "ADMIN" | "SELLER" | "CUSTOMER";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: Role;
  isEmailVerified: boolean;
  createdAt: string;
}

/**
 * Machine-readable codes the backend attaches to errors the client must
 * branch on. Branch on these, never on `message`.
 */
export type AuthErrorCode = "EMAIL_NOT_VERIFIED" | "ACCOUNT_DEACTIVATED";

/** One device session, as listed by GET /auth/sessions. */
export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

/** A Zod issue as serialized by the backend's validation middleware. */
export interface ValidationIssue {
  path: (string | number)[];
  message: string;
  code?: string;
  [key: string]: unknown;
}

export interface ApiSuccessBody<T> {
  success: true;
  message: string;
  data?: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  code?: string;
  errors?: ValidationIssue[];
  stack?: string;
}
