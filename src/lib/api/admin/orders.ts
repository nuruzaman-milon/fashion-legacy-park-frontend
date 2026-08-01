import { apiFetch } from "@/lib/api/client";
import type { Paginated } from "@/types/admin";
import type {
  OrderDetail,
  OrderStatus,
  OrderSummary,
  PaymentStatus,
} from "@/lib/api/orders";

/**
 * Staff order management (`/admin/orders`, bearer). Status moves are
 * forward-only (the backend validates transitions); cancelling restocks
 * every line, and delivering a COD order records its payment as PAID.
 */

export interface AdminOrderListItem extends OrderSummary {
  user: { id: string; name: string; email: string };
  _count: { items: number };
}

export interface AdminOrderDetail extends OrderDetail {
  user: { id: string; name: string; email: string; phone: string | null };
  statusHistory: (OrderDetail["statusHistory"][number] & {
    isPublic: boolean;
    changedById: string | null;
  })[];
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

export async function listAdminOrders(
  params: OrderListParams = {},
): Promise<Paginated<AdminOrderListItem>> {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit ?? 20));
  if (params.page) qs.set("page", String(params.page));
  if (params.search) qs.set("search", params.search);
  if (params.orderStatus) qs.set("orderStatus", params.orderStatus);
  if (params.paymentStatus) qs.set("paymentStatus", params.paymentStatus);
  return apiFetch<Paginated<AdminOrderListItem>>(
    `/admin/orders?${qs.toString()}`,
  );
}

export async function getAdminOrder(id: string): Promise<AdminOrderDetail> {
  return apiFetch<AdminOrderDetail>(`/admin/orders/${id}`);
}

/** The statuses PATCH accepts as targets; PENDING is only ever a start. */
export type OrderStatusTarget = Exclude<OrderStatus, "PENDING" | "RETURNED">;

export async function setAdminOrderStatus(
  id: string,
  status: OrderStatusTarget,
  note?: string,
): Promise<AdminOrderDetail> {
  return apiFetch<AdminOrderDetail>(`/admin/orders/${id}/status`, {
    method: "PATCH",
    body: { status, ...(note && { note }) },
  });
}
