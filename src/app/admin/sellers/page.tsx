import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { SellerTable } from "@/components/admin/sellers/seller-table";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sellers" };

export default function AdminSellersPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <PageHeader
        title="Sellers"
        description="Marketplace shops — onboarding, commissions and payouts. Suspending one pulls their whole catalogue."
        className="mb-2"
      >
        <Button render={<Link href="/admin/sellers/new" />}>
          <PlusIcon data-icon="inline-start" />
          New seller
        </Button>
      </PageHeader>
      <SellerTable />
    </div>
  );
}
