import { apiFetch } from "@/lib/api/client";

/**
 * Checkout coupon preview (`POST /coupons/preview`, bearer). The backend
 * prices the caller's server-side cart (flash deals included) and answers
 * with the saving; a rejection is a 400 whose message is written for the
 * customer and shown verbatim. placeOrder re-runs the same engine, so a
 * previewed code only fails at order time on a race.
 */

export interface CouponPreview {
  code: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  /** Prisma Decimal → string. */
  discountValue: string;
  /** ৳ off the goods; "0.00" for FREE_SHIPPING (delivery zeroes instead). */
  discount: string;
  freeShipping: boolean;
}

export async function previewCoupon(code: string): Promise<CouponPreview> {
  return apiFetch<CouponPreview>("/coupons/preview", {
    method: "POST",
    body: { code },
  });
}
