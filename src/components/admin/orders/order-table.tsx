"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from "lucide-react";

import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AdminOrderStatusBadge,
  PaymentBadge,
} from "@/components/admin/orders/order-badges";
import {
  listAdminOrders,
  type AdminOrderListItem,
} from "@/lib/api/admin/orders";
import type { OrderStatus, PaymentStatus } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { PaginationMeta } from "@/types/admin";

const ALL = "__all__";

const STATUS_FILTER: { value: string; label: string }[] = [
  { value: ALL, label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAYMENT_FILTER: { value: string; label: string }[] = [
  { value: ALL, label: "Paid & unpaid" },
  { value: "PENDING", label: "Unpaid" },
  { value: "PAID", label: "Paid" },
];

function RowsSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }, (_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="ml-auto h-3.5 w-8" /></TableCell>
          <TableCell><Skeleton className="ml-auto h-3.5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-5 w-14 rounded-4xl" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-4xl" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-28" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

/**
 * Server-driven orders table — search and both filters map to the query
 * params of `GET /admin/orders`. Rows link to the order's detail page.
 */
export function OrderTable() {
  const [result, setResult] = React.useState<{
    key: string;
    data: { items: AdminOrderListItem[]; meta: PaginationMeta };
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>(ALL);
  const [payment, setPayment] = React.useState<string>(ALL);
  const [page, setPage] = React.useState(1);
  const [refreshTick, setRefreshTick] = React.useState(0);

  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const queryKey = [page, debouncedSearch, status, payment, refreshTick]
    .map(String)
    .join("|");

  React.useEffect(() => {
    let cancelled = false;
    listAdminOrders({
      page,
      search: debouncedSearch || undefined,
      orderStatus: status === ALL ? undefined : (status as OrderStatus),
      paymentStatus: payment === ALL ? undefined : (payment as PaymentStatus),
    })
      .then((data) => {
        if (cancelled) return;
        setResult({ key: queryKey, data });
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load orders. Please try again.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, status, payment, refreshTick, queryKey]);

  const loading = !error && result?.key !== queryKey;
  const data = result?.data ?? null;
  const meta = data?.meta;

  const applyFilter = (apply: () => void) => {
    setPage(1);
    apply();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search invoice, email, phone or name…"
            aria-label="Search orders"
            className="h-9 pl-8"
            value={search}
            onChange={(e) => applyFilter(() => setSearch(e.target.value))}
          />
        </div>
        <Select
          value={status}
          items={STATUS_FILTER}
          onValueChange={(v) => applyFilter(() => setStatus(v ?? ALL))}
        >
          <SelectTrigger aria-label="Filter by status" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={payment}
          items={PAYMENT_FILTER}
          onValueChange={(v) => applyFilter(() => setPayment(v ?? ALL))}
        >
          <SelectTrigger aria-label="Filter by payment" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_FILTER.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="space-y-3">
          <FormAlert>{error}</FormAlert>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshTick((t) => t + 1)}
          >
            Try again
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Placed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <RowsSkeleton />}
            {!loading && data?.items.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  No orders match these filters.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              data?.items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-sm font-semibold hover:underline"
                    >
                      {order.invoiceNo}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="truncate text-sm">{order.user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.user.email}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {order._count.items}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatPrice(Number(order.total))}
                  </TableCell>
                  <TableCell>
                    <PaymentBadge status={order.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    <AdminOrderStatusBadge status={order.orderStatus} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}

      {meta && !error && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {meta.total} {meta.total === 1 ? "order" : "orders"}
            {meta.totalPages > 1 && ` · page ${meta.page} of ${meta.totalPages}`}
          </p>
          {meta.totalPages > 1 && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                disabled={!meta.hasPrev || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                disabled={!meta.hasNext || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
