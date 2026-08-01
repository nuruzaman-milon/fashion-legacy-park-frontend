import type { Metadata } from "next";

import { OrderTable } from "@/components/admin/orders/order-table";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <PageHeader
        title="Orders"
        description="Every order on the store — confirm, ship and deliver from the order page."
        className="mb-2"
      />
      <OrderTable />
    </div>
  );
}
