import type { Metadata } from "next";

import { CouponForm } from "@/components/admin/coupons/coupon-form";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "New coupon" };

export default function NewCouponPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title="New coupon" />
      <CouponForm />
    </div>
  );
}
