import { apiFetch } from "@/lib/api/client";
import type { OrderStatus } from "@/lib/api/orders";

/** `GET /admin/stats` — the dashboard's single read (bearer). */
export interface DashboardStats {
  /** Non-cancelled order totals of the last 30 days; Decimal → string. */
  revenue30d: string;
  revenueDeltaPct: number | null;
  /** Every order placed in the window, cancelled included. */
  orders30d: number;
  ordersDeltaPct: number | null;
  pendingOrders: number;
  activeProducts: number;
  draftProducts: number;
  customers: number;
  newCustomers30d: number;
  customersDeltaPct: number | null;
  recentOrders: {
    id: string;
    invoiceNo: string;
    customer: string;
    itemCount: number;
    total: string;
    orderStatus: OrderStatus;
    createdAt: string;
  }[];
  lowStock: {
    variantId: string;
    productId: string;
    product: string;
    variant: string;
    sku: string;
    stock: number;
    image: string | null;
  }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/admin/stats");
}
