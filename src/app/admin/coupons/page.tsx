import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { CouponTable } from "@/components/admin/coupons/coupon-table";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Coupons" };

export default function AdminCouponsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <PageHeader
        title="Coupons"
        description="Discount codes customers apply at checkout — store-wide, or scoped to categories and products."
        className="mb-2"
      >
        <Button render={<Link href="/admin/coupons/new" />}>
          <PlusIcon data-icon="inline-start" />
          New coupon
        </Button>
      </PageHeader>
      <CouponTable />
    </div>
  );
}
