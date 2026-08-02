import { Badge } from "@/components/ui/badge";
import type { AdminCoupon } from "@/lib/api/admin/coupons";

/**
 * Where a coupon sits relative to now. "off" (isActive = false) trumps
 * everything; a null startsAt/expiresAt boundary is open-ended, and a spent
 * usage limit parks the coupon at "exhausted" even inside its window.
 */
export type CouponStatus =
  | "live"
  | "scheduled"
  | "expired"
  | "exhausted"
  | "off";

export function statusOf(
  coupon: Pick<
    AdminCoupon,
    "isActive" | "startsAt" | "expiresAt" | "totalUsageLimit" | "usedCount"
  >,
  now: number,
): CouponStatus {
  if (!coupon.isActive) return "off";
  if (coupon.startsAt && now < Date.parse(coupon.startsAt)) return "scheduled";
  if (coupon.expiresAt && now >= Date.parse(coupon.expiresAt)) return "expired";
  if (
    coupon.totalUsageLimit !== null &&
    coupon.usedCount >= coupon.totalUsageLimit
  ) {
    return "exhausted";
  }
  return "live";
}

const LOOKS: Record<CouponStatus, { label: string; className: string }> = {
  live: {
    label: "Live",
    className:
      "border-emerald-600/25 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  },
  scheduled: {
    label: "Scheduled",
    className: "border-sky-600/25 bg-sky-600/10 text-sky-700 dark:text-sky-400",
  },
  exhausted: {
    label: "Used up",
    className:
      "border-amber-600/25 bg-amber-600/10 text-amber-700 dark:text-amber-400",
  },
  expired: { label: "Expired", className: "text-muted-foreground" },
  off: { label: "Disabled", className: "text-muted-foreground" },
};

export function CouponStatusBadge({ status }: { status: CouponStatus }) {
  const look = LOOKS[status];
  return (
    <Badge variant="outline" className={look.className}>
      {look.label}
    </Badge>
  );
}
