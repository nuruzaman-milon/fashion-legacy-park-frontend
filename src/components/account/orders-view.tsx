"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PackageIcon,
} from "lucide-react";

import { FormAlert } from "@/components/auth/form-alert";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/components/product/product-thumb";
import { Skeleton } from "@/components/ui/skeleton";
import { listMyOrders, type OrderSummary } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { formatDate, formatPrice } from "@/lib/format";
import type { PaginationMeta } from "@/types/admin";

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** The customer's order history, newest first. */
export function OrdersView() {
  const [result, setResult] = React.useState<{
    page: number;
    items: OrderSummary[];
    meta: PaginationMeta;
  } | null>(null);
  const [page, setPage] = React.useState(1);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    listMyOrders(page)
      .then(({ items, meta }) => {
        if (!cancelled) {
          setResult({ page, items, meta });
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not load your orders. Please try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  if (error && result === null) {
    return <FormAlert>{error}</FormAlert>;
  }
  if (result === null || result.page !== page) {
    return <ListSkeleton />;
  }

  if (result.items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-16 text-center">
        <PackageIcon className="size-8 text-muted-foreground" />
        <p className="font-heading mt-4 text-lg font-medium">No orders yet</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          When you place an order it shows up here with live status tracking.
        </p>
        <Button className="mt-5" render={<Link href="/products" />}>
          Start shopping
          <ArrowRightIcon />
        </Button>
      </div>
    );
  }

  const { items, meta } = result;

  return (
    <div className="space-y-3">
      {items.map((order) => {
        const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
        return (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="block rounded-xl border bg-card p-4 transition-colors hover:border-foreground/30 sm:p-5"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="font-mono text-sm font-semibold">
                #{order.invoiceNo}
              </span>
              <OrderStatusBadge status={order.orderStatus} />
              <span className="text-xs text-muted-foreground">
                {formatDate(order.createdAt)} · {itemCount}{" "}
                {itemCount === 1 ? "item" : "items"}
              </span>
              <span className="ml-auto text-sm font-semibold tabular-nums">
                {formatPrice(Number(order.total))}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {order.items.slice(0, 4).map((item) => (
                <ProductThumb
                  key={item.id}
                  title={item.title}
                  image={item.image}
                  seed={item.id}
                  className="aspect-3/4 w-10 rounded-md"
                  sizes="40px"
                />
              ))}
              {order.items.length > 4 && (
                <span className="text-xs text-muted-foreground">
                  +{order.items.length - 4} more
                </span>
              )}
              <span className="ml-auto flex items-center gap-1 text-xs font-medium text-brand">
                View order
                <ArrowRightIcon className="size-3.5" />
              </span>
            </div>
          </Link>
        );
      })}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Previous page"
              disabled={!meta.hasPrev}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Next page"
              disabled={!meta.hasNext}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
