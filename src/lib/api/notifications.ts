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
  | "SELLER"
  | "CHAT";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

/** Total for the bell badge, per-type for the category tabs. */
export interface UnreadSummary {
  count: number;
  byType: Partial<Record<NotificationType, number>>;
}

export async function listNotifications(
  limit = 12,
  type?: NotificationType,
): Promise<Paginated<AppNotification>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (type) params.set("type", type);
  return apiFetch<Paginated<AppNotification>>(`/notifications?${params}`);
}

export async function getUnreadSummary(): Promise<UnreadSummary> {
  return apiFetch<UnreadSummary>("/notifications/unread-count");
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/notifications/read-all", { method: "POST" });
}
