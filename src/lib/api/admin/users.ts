import { apiFetch } from "@/lib/api/client";
import type { Paginated } from "@/types/admin";
import type { Role } from "@/types/auth";

/**
 * Staff-side user management (`/admin/users`, bearer). List/read for ADMIN
 * and SUPER_ADMIN; role changes are SUPER_ADMIN-only, and the backend guards
 * the dangerous edges (self-change, last super admin, SELLER rows — those
 * are managed through the seller endpoints).
 */

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: Role;
  isActive: boolean;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
  isActive?: boolean;
  isVerified?: boolean;
}

export async function listAdminUsers(
  params: UserListParams = {},
): Promise<Paginated<AdminUserRow>> {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit ?? 20));
  if (params.page) qs.set("page", String(params.page));
  if (params.search) qs.set("search", params.search);
  if (params.role) qs.set("role", params.role);
  if (params.isActive !== undefined) qs.set("isActive", String(params.isActive));
  if (params.isVerified !== undefined) {
    qs.set("isVerified", String(params.isVerified));
  }
  return apiFetch<Paginated<AdminUserRow>>(`/admin/users?${qs.toString()}`);
}

/** SELLER is not assignable here — sellers get their role via their Seller row. */
export type AssignableRole = Exclude<Role, "SELLER">;

export async function updateUserRole(
  id: string,
  role: AssignableRole,
): Promise<AdminUserRow> {
  return apiFetch<AdminUserRow>(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: { role },
  });
}

/** Deactivating also revokes the user's refresh tokens server-side. */
export async function updateUserStatus(
  id: string,
  isActive: boolean,
): Promise<AdminUserRow> {
  return apiFetch<AdminUserRow>(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: { isActive },
  });
}
