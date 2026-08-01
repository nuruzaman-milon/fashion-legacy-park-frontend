"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BellIcon, CheckCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api/notifications";
import { formatRelativeTime } from "@/lib/format";

const POLL_MS = 30_000;

/**
 * The admin bell: badge polls the unread count every 30s, opening fetches
 * the latest notifications, clicking one marks it read and follows its
 * link. No sockets — a half-minute lag is fine for a back office.
 */
export function NotificationsBell() {
  const router = useRouter();
  const [count, setCount] = React.useState(0);
  const [items, setItems] = React.useState<AppNotification[] | null>(null);

  const refreshCount = React.useCallback(() => {
    getUnreadCount().then(setCount).catch(() => {
      // A missed poll keeps the previous badge; the next tick corrects it.
    });
  }, []);

  React.useEffect(() => {
    refreshCount();
    const handle = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(handle);
  }, [refreshCount]);

  function handleOpenChange(open: boolean) {
    if (!open) return;
    setItems(null);
    listNotifications()
      .then(({ items: list }) => setItems(list))
      .catch(() => setItems([]));
  }

  function follow(notification: AppNotification) {
    if (!notification.isRead) {
      // Fire-and-forget: the navigation must not wait on bookkeeping.
      void markNotificationRead(notification.id).then(refreshCount, () => {});
      setCount((c) => Math.max(0, c - 1));
    }
    if (notification.link) router.push(notification.link);
  }

  function readAll() {
    setItems(
      (prev) => prev?.map((n) => ({ ...n, isRead: true })) ?? prev,
    );
    setCount(0);
    void markAllNotificationsRead().then(refreshCount, () => {});
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              count > 0 ? `Notifications (${count} unread)` : "Notifications"
            }
            className="relative"
          />
        }
      >
        <BellIcon className="size-4" />
        {count > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-foreground tabular-nums">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
          <p className="text-sm font-medium">Notifications</p>
          {count > 0 && (
            <button
              type="button"
              onClick={readAll}
              className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              <CheckCheckIcon className="size-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto p-1">
          {items === null && (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          )}
          {items?.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nothing yet — new orders and reviews show up here.
            </p>
          )}
          {items?.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => follow(notification)}
              className="items-start gap-2.5 py-2.5"
            >
              <span
                aria-hidden
                className={`mt-1.5 size-2 shrink-0 rounded-full ${
                  notification.isRead ? "bg-transparent" : "bg-brand"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-sm ${
                    notification.isRead ? "" : "font-semibold"
                  }`}
                >
                  {notification.title}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {notification.message}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground/80">
                  {formatRelativeTime(notification.createdAt)}
                </span>
              </span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
