import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { FlashSaleTable } from "@/components/admin/flash-sales/flash-sale-table";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Flash sales" };

export default function AdminFlashSalesPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <PageHeader
        title="Flash sales"
        description="Timed campaigns — the most recently started live sale shows on the homepage."
        className="mb-2"
      >
        <Button render={<Link href="/admin/flash-sales/new" />}>
          <PlusIcon data-icon="inline-start" />
          New flash sale
        </Button>
      </PageHeader>
      <FlashSaleTable />
    </div>
  );
}
