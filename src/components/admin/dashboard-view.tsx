"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon, TriangleAlertIcon } from "lucide-react";

import { FormAlert } from "@/components/auth/form-alert";
import { AdminOrderStatusBadge } from "@/components/admin/orders/order-badges";
import { StatTile } from "@/components/admin/stat-tile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getDashboardStats,
  type DashboardStats,
} from "@/lib/api/admin/stats";
import { ApiError } from "@/lib/api/client";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 w-full rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    </>
  );
}

/** Live store overview — every figure comes from `GET /admin/stats`. */
export function DashboardView() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    return getDashboardStats()
      .then(setStats)
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load the dashboard. Please try again.",
        );
      });
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (error && stats === null) {
    return (
      <div className="space-y-3">
        <FormAlert>{error}</FormAlert>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setError(null);
            void load();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }
  if (stats === null) return <DashboardSkeleton />;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Revenue (30 days)"
          value={formatPrice(Number(stats.revenue30d))}
          deltaPct={stats.revenueDeltaPct ?? undefined}
          hint="Cancelled orders excluded"
        />
        <StatTile
          label="Orders (30 days)"
          value={String(stats.orders30d)}
          deltaPct={stats.ordersDeltaPct ?? undefined}
          hint={
            stats.pendingOrders > 0
              ? `${stats.pendingOrders} awaiting confirmation`
              : "Nothing awaiting confirmation"
          }
        />
        <StatTile
          label="Active products"
          value={String(stats.activeProducts)}
          hint={`${stats.draftProducts} ${
            stats.draftProducts === 1 ? "draft" : "drafts"
          } in progress`}
        />
        <StatTile
          label="Customers"
          value={String(stats.customers)}
          deltaPct={stats.customersDeltaPct ?? undefined}
          hint={`${stats.newCustomers30d} joined this month`}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No orders yet — they show up here the moment one is placed.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Placed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-semibold hover:underline"
                        >
                          {order.invoiceNo}
                        </Link>
                      </TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {order.itemCount}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatPrice(Number(order.total))}
                      </TableCell>
                      <TableCell>
                        <AdminOrderStatusBadge status={order.orderStatus} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatRelativeTime(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 justify-start gap-1 text-muted-foreground"
              render={<Link href="/admin/orders" />}
            >
              View all orders
              <ArrowUpRightIcon className="size-3.5" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-400" />
              Low stock
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {stats.lowStock.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">
                Every variant is comfortably stocked.
              </p>
            )}
            {stats.lowStock.map((item) => (
              <Link
                key={item.variantId}
                href={`/admin/products/${item.productId}/edit`}
                className="flex items-center gap-3"
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt=""
                    width={40}
                    height={48}
                    className="h-12 w-10 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-12 w-10 shrink-0 rounded-md bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.product}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.variant} · {item.sku}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-xs font-medium",
                    item.stock === 0
                      ? "text-destructive"
                      : "text-amber-700 dark:text-amber-400",
                  )}
                >
                  {item.stock === 0 ? "Out of stock" : `${item.stock} left`}
                </span>
              </Link>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-1 text-muted-foreground"
              render={<Link href="/admin/products" />}
            >
              View all inventory
              <ArrowUpRightIcon className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
