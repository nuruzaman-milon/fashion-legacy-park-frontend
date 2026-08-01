import type { Metadata } from "next";

import { OrdersView } from "@/components/account/orders-view";

export const metadata: Metadata = { title: "My orders" };

export default function AccountOrdersPage() {
  return <OrdersView />;
}
