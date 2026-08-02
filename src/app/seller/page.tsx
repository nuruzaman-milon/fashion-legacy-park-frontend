import type { Metadata } from "next";

import { SellerOverview } from "@/components/seller/seller-overview";

export const metadata: Metadata = { title: "Overview" };

export default function SellerOverviewPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <SellerOverview />
    </div>
  );
}
