import type { Metadata } from "next";

import { OrderDetailView } from "@/components/account/order-detail-view";

export const metadata: Metadata = { title: "Order details" };

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <OrderDetailView orderId={id} />;
}
