import { apiFetch } from "@/lib/api/client";
import type { Paginated } from "@/types/admin";

/**
 * Seller management (`/admin/sellers`, ADMIN/SUPER_ADMIN bearer). Creating a
 * seller makes the login account AND the shop record in one transaction —
 * the seller gets a set-your-password invite email, no password is chosen
 * here. Suspending pulls the whole catalogue off the storefront immediately.
 */

export type SellerStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";

export interface AdminSeller {
  id: string;
  /** Internal reference like "SLR-0007" — never shown on the storefront. */
  code: string;
  shopName: string;
  contactName: string | null;
  contactPhone: string;
  contactEmail: string | null;
  address: string | null;
  /** Prisma Decimal → string; percent of gross the platform keeps. */
  commissionRate: string;
  status: SellerStatus;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  bankBranch: string | null;
  bkashNumber: string | null;
  approvedAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; isActive: boolean };
}

export interface SellerListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: SellerStatus;
}

export async function listAdminSellers(
  params: SellerListParams = {},
): Promise<Paginated<AdminSeller>> {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit ?? 20));
  if (params.page) qs.set("page", String(params.page));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  return apiFetch<Paginated<AdminSeller>>(`/admin/sellers?${qs.toString()}`);
}

export async function getAdminSeller(id: string): Promise<AdminSeller> {
  return apiFetch<AdminSeller>(`/admin/sellers/${id}`);
}

/** Shop + payout fields both endpoints share; strings are trimmed backend-side. */
export interface SellerPayload {
  shopName?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  commissionRate?: number;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  bkashNumber?: string;
}

/** `name`/`email` open the seller's login account; the invite email follows. */
export async function createSeller(
  payload: SellerPayload & {
    name: string;
    email: string;
    shopName: string;
    contactPhone: string;
  },
): Promise<AdminSeller> {
  return apiFetch<AdminSeller>("/admin/sellers", {
    method: "POST",
    body: payload,
  });
}

export async function updateSeller(
  id: string,
  payload: SellerPayload,
): Promise<AdminSeller> {
  return apiFetch<AdminSeller>(`/admin/sellers/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

/** APPROVED stamps approvedAt/approvedBy; SUSPENDED hides their catalogue. */
export async function setSellerStatus(
  id: string,
  status: SellerStatus,
): Promise<AdminSeller> {
  return apiFetch<AdminSeller>(`/admin/sellers/${id}/status`, {
    method: "PATCH",
    body: { status },
  });
}
