import { apiFetch } from "./client";
import type { Paginated } from "@/types/admin";

/**
 * Customer orders (`/orders`, bearer — docs: backend modules/order). Placing
 * an order consumes the server-side cart: prices re-resolve there (flash
 * deals included), stock is claimed conditionally, and the cart empties on
 * success — reload the shop provider afterwards.
 */

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface OrderItemInfo {
  id: string;
  productId: string | null;
  title: string;
  variantName: string | null;
  sku?: string;
  quantity: number;
  /** Prisma Decimal → string. */
  unitPrice: string;
  totalPrice?: string;
  image: string | null;
  product?: { slug: string } | null;
  /** The customer's review of this line, if any (detail payload only). */
  review?: {
    id: string;
    rating: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
  } | null;
}

export interface OrderSummary {
  id: string;
  invoiceNo: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "COD" | "BKASH" | "SSLCOMMERZ";
  subtotal: string;
  /** Already 0 when a FREE_SHIPPING coupon was applied. */
  shippingCharge: string;
  tax: string;
  /** ৳ taken off the goods by a coupon; "0" when none. */
  discount: string;
  couponCode: string | null;
  total: string;
  createdAt: string;
  items: OrderItemInfo[];
}

export interface OrderDetail extends OrderSummary {
  /** Account contact snapshot taken at purchase time. */
  email: string;
  phone: string;
  shipReceiverName: string;
  shipPhone: string;
  shipDistrict: string;
  shipAddress: string;
  note: string | null;
  cancelReason: string | null;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  statusHistory: {
    id: string;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    note: string | null;
    createdAt: string;
  }[];
}

export interface PlaceOrderPayload {
  receiverName: string;
  phone: string;
  district: string;
  address: string;
  paymentMethod: "COD";
  note?: string;
  /** Validated and priced server-side; rejections come back as 4xx messages. */
  couponCode?: string;
}

export async function placeOrder(
  payload: PlaceOrderPayload,
): Promise<OrderDetail> {
  return apiFetch<OrderDetail>("/orders", { method: "POST", body: payload });
}

export async function listMyOrders(
  page = 1,
): Promise<Paginated<OrderSummary>> {
  return apiFetch<Paginated<OrderSummary>>(`/orders?page=${page}&limit=10`);
}

export async function getMyOrder(id: string): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/orders/${id}`);
}

/** Allowed while PENDING or CONFIRMED — after that it's a return, not an undo. */
export async function cancelMyOrder(
  id: string,
  reason?: string,
): Promise<OrderDetail> {
  return apiFetch<OrderDetail>(`/orders/${id}/cancel`, {
    method: "POST",
    body: { ...(reason && { reason }) },
  });
}

/**
 * One review per purchased line, only after delivery. It goes into the
 * moderation queue (PENDING) — the product page shows it once approved.
 */
export async function submitReview(
  orderItemId: string,
  rating: number,
  comment?: string,
): Promise<{ id: string; rating: number; status: string }> {
  return apiFetch(`/reviews`, {
    method: "POST",
    body: { orderItemId, rating, ...(comment && { comment }) },
  });
}
