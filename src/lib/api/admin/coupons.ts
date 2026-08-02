import { apiFetch } from "@/lib/api/client";
import type { Paginated } from "@/types/admin";

/**
 * Coupon CRUD (`/admin/coupons`, ADMIN/SUPER_ADMIN bearer). A coupon with
 * neither categories nor products attached applies store-wide; attaching
 * either scopes it to just those. Checkout does not consume coupons yet —
 * this module manages the catalogue the future checkout step will read.
 */

export type CouponDiscountType = "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";

export interface AdminCoupon {
  id: string;
  name: string;
  /** Stored uppercase; unique. */
  code: string;
  description: string | null;
  discountType: CouponDiscountType;
  /** Prisma Decimal → string. Zero (ignored) for FREE_SHIPPING. */
  discountValue: string;
  minimumOrderAmount: string | null;
  /** Absolute ৳ cap for a PERCENTAGE coupon; null elsewhere. */
  maximumDiscount: string | null;
  /** null = unlimited redemptions. */
  totalUsageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  /** null boundaries are open-ended. */
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  applyWithFlashSale: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AdminCouponListItem = AdminCoupon & {
  _count: { categories: number; products: number; redemptions: number };
};

export interface AdminCouponDetail extends AdminCoupon {
  categories: {
    categoryId: string;
    category: { id: string; name: string; slug: string };
  }[];
  products: {
    productId: string;
    product: { id: string; name: string; slug: string };
  }[];
  _count: { redemptions: number };
}

/** One page covers any realistic coupon list (backend caps limit at 100). */
export async function getAdminCoupons(): Promise<AdminCouponListItem[]> {
  const { items } = await apiFetch<Paginated<AdminCouponListItem>>(
    "/admin/coupons?limit=100&sortBy=createdAt&sortOrder=desc",
  );
  return items;
}

export async function getAdminCoupon(id: string): Promise<AdminCouponDetail> {
  return apiFetch<AdminCouponDetail>(`/admin/coupons/${id}`);
}

export interface CouponPayload {
  name?: string;
  /** The backend uppercases and 409s on a duplicate. */
  code?: string;
  description?: string | null;
  discountType?: CouponDiscountType;
  discountValue?: number;
  minimumOrderAmount?: number | null;
  maximumDiscount?: number | null;
  totalUsageLimit?: number | null;
  perUserLimit?: number;
  /** ISO datetimes; null = open-ended. */
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  applyWithFlashSale?: boolean;
  /** Full replace when sent; omit to leave the attachments untouched. */
  categoryIds?: string[];
  productIds?: string[];
}

export async function createCoupon(
  payload: CouponPayload & {
    name: string;
    code: string;
    discountType: CouponDiscountType;
  },
): Promise<AdminCoupon> {
  return apiFetch<AdminCoupon>("/admin/coupons", {
    method: "POST",
    body: payload,
  });
}

export async function updateCoupon(
  id: string,
  payload: CouponPayload,
): Promise<AdminCoupon> {
  return apiFetch<AdminCoupon>(`/admin/coupons/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

/** Attachments and redemptions cascade; past orders keep their code snapshot. */
export async function deleteCoupon(id: string): Promise<void> {
  await apiFetch(`/admin/coupons/${id}`, { method: "DELETE" });
}
