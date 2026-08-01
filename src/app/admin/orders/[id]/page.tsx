import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { AdminOrderDetailView } from "@/components/admin/orders/order-detail";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Order details" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader title="Order details">
        <Button variant="outline" render={<Link href="/admin/orders" />}>
          <ArrowLeftIcon data-icon="inline-start" />
          All orders
        </Button>
      </PageHeader>
      <AdminOrderDetailView orderId={id} />
    </div>
  );
}
