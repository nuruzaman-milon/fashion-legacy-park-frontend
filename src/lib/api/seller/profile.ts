import { apiFetch } from "@/lib/api/client";

/**
 * The signed-in seller's own shop profile (`/seller/me`, SELLER bearer).
 * `code`, `status` and `commissionRate` are admin-controlled — the PATCH
 * only accepts shop contact and payout fields.
 */

export type SellerStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "REJECTED";

export interface SellerProfile {
  id: string;
  /** Internal "SLR-0001" code; never shown on the storefront. */
  code: string;
  shopName: string;
  contactName: string | null;
  contactPhone: string;
  contactEmail: string | null;
  address: string | null;
  /** Prisma Decimal → string. The % the platform keeps per sale. */
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

export async function getSellerProfile(): Promise<SellerProfile> {
  return apiFetch<SellerProfile>("/seller/me");
}

/**
 * All optional; the backend rejects empty strings on formatted fields
 * (phone/email), so omit what the user left blank rather than sending "".
 */
export interface SellerProfilePayload {
  shopName?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  bkashNumber?: string;
}

export async function updateSellerProfile(
  payload: SellerProfilePayload,
): Promise<SellerProfile> {
  return apiFetch<SellerProfile>("/seller/me", {
    method: "PATCH",
    body: payload,
  });
}
