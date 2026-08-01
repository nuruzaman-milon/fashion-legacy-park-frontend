import { apiFetch } from "./client";
import type { Paginated } from "@/types/admin";

/**
 * The signed-in user's notifications (`/notifications`, bearer). Rows are
 * per-user — today only admins receive any (new orders, reviews, stock),
 * but the same endpoints will serve a storefront bell unchanged.
 */

export type NotificationType =
  | "SYSTEM"
  | "ORDER"
  | "PAYMENT"
  | "PROMOTION"
  | "SELLER";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function listNotifications(
  limit = 12,
): Promise<Paginated<AppNotification>> {
  return apiFetch<Paginated<AppNotification>>(`/notifications?limit=${limit}`);
}

export async function getUnreadCount(): Promise<number> {
  const { count } = await apiFetch<{ count: number }>(
    "/notifications/unread-count",
  );
  return count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/notifications/read-all", { method: "POST" });
}
