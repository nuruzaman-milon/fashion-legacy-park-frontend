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
  getUnreadSummary,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationType,
  type UnreadSummary,
} from "@/lib/api/notifications";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";

const POLL_MS = 30_000;

/**
 * One tab per notification category. "All" also carries the rarely-used
 * types (PAYMENT, PROMOTION) so nothing is ever unreachable.
 */
const TABS: { key: string; label: string; type?: NotificationType }[] = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders", type: "ORDER" },
  { key: "chat", label: "Chat", type: "CHAT" },
  { key: "sellers", label: "Sellers", type: "SELLER" },
  { key: "system", label: "System", type: "SYSTEM" },
];

const EMPTY_SUMMARY: UnreadSummary = { count: 0, byType: {} };

/**
 * The admin bell: badge polls the unread summary every 30s, opening fetches
 * the active tab's notifications, clicking one marks it read and follows
 * its link. No sockets — a half-minute lag is fine for a back office.
 */
export function NotificationsBell() {
  const router = useRouter();
  const [summary, setSummary] = React.useState<UnreadSummary>(EMPTY_SUMMARY);
  const [tab, setTab] = React.useState("all");
  // The result carries its tab so a stale response never renders.
  const [result, setResult] = React.useState<{
    tab: string;
    items: AppNotification[];
  } | null>(null);

  const refreshSummary = React.useCallback(() => {
    getUnreadSummary().then(setSummary).catch(() => {
      // A missed poll keeps the previous badge; the next tick corrects it.
    });
  }, []);

  React.useEffect(() => {
    refreshSummary();
    const handle = setInterval(refreshSummary, POLL_MS);
    return () => clearInterval(handle);
  }, [refreshSummary]);

  const load = React.useCallback((tabKey: string) => {
    const target = TABS.find((t) => t.key === tabKey);
    listNotifications(12, target?.type)
      .then(({ items }) => setResult({ tab: tabKey, items }))
      .catch(() => setResult({ tab: tabKey, items: [] }));
  }, []);

  function handleOpenChange(open: boolean) {
    if (!open) return;
    setResult(null);
    load(tab);
  }

  function switchTab(tabKey: string) {
    if (tabKey === tab) return;
    setTab(tabKey);
    load(tabKey);
  }

  function follow(notification: AppNotification) {
    if (!notification.isRead) {
      // Fire-and-forget: the navigation must not wait on bookkeeping.
      void markNotificationRead(notification.id).then(refreshSummary, () => {});
      setSummary((s) => ({
        count: Math.max(0, s.count - 1),
        byType: {
          ...s.byType,
          [notification.type]: Math.max(
            0,
            (s.byType[notification.type] ?? 0) - 1,
          ),
        },
      }));
    }
    if (notification.link) router.push(notification.link);
  }

  function readAll() {
    setResult((prev) =>
      prev
        ? { ...prev, items: prev.items.map((n) => ({ ...n, isRead: true })) }
        : prev,
    );
    setSummary(EMPTY_SUMMARY);
    void markAllNotificationsRead().then(refreshSummary, () => {});
  }

  const items = result?.tab === tab ? result.items : null;
  const count = summary.count;

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
      <DropdownMenuContent align="end" className="w-96 p-0">
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

        <div
          role="tablist"
          aria-label="Notification categories"
          className="flex gap-1 border-b border-border px-2 py-1.5"
        >
          {TABS.map((t) => {
            const unread = t.type
              ? (summary.byType[t.type] ?? 0)
              : summary.count;
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchTab(t.key)}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t.label}
                {unread > 0 && (
                  <span
                    className={cn(
                      "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
                      active
                        ? "bg-primary-foreground/20"
                        : "bg-brand text-brand-foreground",
                    )}
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </button>
            );
          })}
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
              {tab === "all"
                ? "Nothing yet — new orders, chats and reviews show up here."
                : "Nothing in this category yet."}
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
