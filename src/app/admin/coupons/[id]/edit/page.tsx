import type { Metadata } from "next";

import { CouponForm } from "@/components/admin/coupons/coupon-form";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Edit coupon" };

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title="Edit coupon" />
      <CouponForm couponId={id} />
    </div>
  );
}
