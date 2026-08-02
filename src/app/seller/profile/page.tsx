import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/page-header";
import { ShopProfileForm } from "@/components/seller/shop-profile-form";

export const metadata: Metadata = { title: "Shop profile" };

export default function SellerProfilePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Shop profile"
        description="Contact and payout details. Commission and approval are managed by the platform."
      />
      <ShopProfileForm />
    </div>
  );
}
