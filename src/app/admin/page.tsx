import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon, PlusIcon, TriangleAlertIcon } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { StatTile } from "@/components/admin/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminStats,
  mockLowStock,
  mockRecentOrders,
  type MockRecentOrder,
} from "@/lib/api/mock/admin-data";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const ORDER_STATUS: Record<
  MockRecentOrder["status"],
  { label: string; className: string }
> = {
  PENDING: { label: "Pending", className: "" },
  CONFIRMED: { label: "Confirmed", className: "" },
  SHIPPED: {
    label: "Shipped",
    className: "border-transparent bg-secondary text-secondary-foreground",
  },
  DELIVERED: {
    label: "Delivered",
    className:
      "border-emerald-600/25 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
};

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Store overview. Sales figures are sample data until the orders API ships."
      >
        <Button render={<Link href="/admin/products/new" />}>
          <PlusIcon data-icon="inline-start" />
          Add product
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Revenue (30 days)"
          value={formatPrice(Number(adminStats.revenue30d))}
          deltaPct={adminStats.revenueDeltaPct}
        />
        <StatTile
          label="Orders (30 days)"
          value={String(adminStats.orders30d)}
          deltaPct={adminStats.ordersDeltaPct}
        />
        <StatTile
          label="Active products"
          value={String(adminStats.activeProducts)}
          hint={`${adminStats.draftProducts} drafts in progress`}
        />
        <StatTile
          label="Customers"
          value={String(adminStats.customers)}
          deltaPct={adminStats.customersDeltaPct}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent>
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
                {mockRecentOrders.map((order) => {
                  const status = ORDER_STATUS[order.status];
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.orderNo}
                      </TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {order.itemCount}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatPrice(Number(order.total))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(status.className)}
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatRelativeTime(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
            {mockLowStock.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
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
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-1 text-muted-foreground"
              render={<Link href="/admin/products?stock=low" />}
            >
              View all inventory
              <ArrowUpRightIcon className="size-3.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
