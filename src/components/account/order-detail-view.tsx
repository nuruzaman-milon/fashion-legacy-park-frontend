"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormAlert } from "@/components/auth/form-alert";
import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { Button } from "@/components/ui/button";
import { ProductThumb } from "@/components/product/product-thumb";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  cancelMyOrder,
  getMyOrder,
  type OrderDetail,
} from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { formatDateTime, formatPrice } from "@/lib/format";

const STEP_LABEL: Record<string, string> = {
  PENDING: "Order placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Being prepared",
  SHIPPED: "Handed to courier",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

/** One order: timeline, items, delivery and money — plus cancel while early. */
export function OrderDetailView({ orderId }: { orderId: string }) {
  const [order, setOrder] = React.useState<OrderDetail | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelBusy, setCancelBusy] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getMyOrder(orderId)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError && err.status === 404
              ? "This order doesn't exist on your account."
              : err instanceof ApiError
                ? err.message
                : "Could not load the order. Please try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  async function confirmCancel() {
    setCancelBusy(true);
    setCancelError(null);
    try {
      const updated = await cancelMyOrder(orderId);
      setOrder(updated);
      setCancelOpen(false);
    } catch (err) {
      setCancelError(
        err instanceof ApiError
          ? err.message
          : "Could not cancel the order. Please try again.",
      );
      setCancelOpen(false);
    } finally {
      setCancelBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <FormAlert>{loadError}</FormAlert>
        <Button variant="outline" render={<Link href="/account/orders" />}>
          <ArrowLeftIcon data-icon="inline-start" />
          Back to orders
        </Button>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const cancellable =
    order.orderStatus === "PENDING" || order.orderStatus === "CONFIRMED";

  return (
    <div className="space-y-5">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
      >
        <ArrowLeftIcon className="size-4" />
        All orders
      </Link>

      {cancelError && <FormAlert>{cancelError}</FormAlert>}

      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="font-mono text-lg font-semibold">
            #{order.invoiceNo}
          </h2>
          <OrderStatusBadge status={order.orderStatus} />
          <span className="text-xs text-muted-foreground">
            Placed {formatDateTime(order.createdAt)}
          </span>
          {cancellable && (
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => setCancelOpen(true)}
            >
              Cancel order
            </Button>
          )}
        </div>
        {order.orderStatus === "CANCELLED" && order.cancelReason && (
          <p className="mt-2 text-sm text-muted-foreground">
            Reason: {order.cancelReason}
          </p>
        )}

        <ol className="mt-5 space-y-3">
          {order.statusHistory.map((step) => (
            <li key={step.id} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/10">
                <CheckIcon className="size-3 text-brand" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {STEP_LABEL[step.toStatus] ?? step.toStatus}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(step.createdAt)}
                  {step.note && <> · {step.note}</>}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-heading text-base font-medium">Items</h3>
        <ul className="mt-4 space-y-4">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <ProductThumb
                title={item.title}
                image={item.image}
                seed={item.id}
                className="aspect-3/4 w-12 shrink-0 rounded-lg"
                sizes="48px"
              />
              <div className="min-w-0 flex-1">
                {item.product?.slug ? (
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {item.title}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-medium">{item.title}</p>
                )}
                <p className="truncate text-xs text-muted-foreground">
                  {item.variantName && item.variantName !== "Default"
                    ? `${item.variantName} · `
                    : ""}
                  {formatPrice(Number(item.unitPrice))} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-medium tabular-nums">
                {formatPrice(Number(item.unitPrice) * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-heading text-base font-medium">Delivery</h3>
          <p className="mt-3 text-sm font-medium">{order.shipReceiverName}</p>
          <p className="text-sm text-muted-foreground">
            {order.shipAddress}, {order.shipDistrict}
          </p>
          <p className="text-sm text-muted-foreground">{order.shipPhone}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            Payment:{" "}
            {order.paymentMethod === "COD"
              ? "Cash on delivery"
              : order.paymentMethod}
            {order.paymentStatus === "PAID" && " · paid"}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h3 className="font-heading text-base font-medium">Summary</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">
                {formatPrice(Number(order.subtotal))}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="font-medium">
                {Number(order.shippingCharge) === 0
                  ? "Free"
                  : formatPrice(Number(order.shippingCharge))}
              </dd>
            </div>
            {Number(order.tax) > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">VAT</dt>
                <dd className="font-medium">{formatPrice(Number(order.tax))}</dd>
              </div>
            )}
          </dl>
          <Separator className="my-3" />
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Total</span>
            <span className="text-xl font-semibold">
              {formatPrice(Number(order.total))}
            </span>
          </div>
        </div>
      </div>

      <AlertDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          if (!open && !cancelBusy) setCancelOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
          <AlertDialogDescription>
            #{order.invoiceNo} will be cancelled and every item goes back on
            sale. This cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" disabled={cancelBusy} />}
            >
              Keep order
            </AlertDialogClose>
            <Button
              variant="destructive"
              disabled={cancelBusy}
              onClick={() => void confirmCancel()}
            >
              {cancelBusy ? "Cancelling…" : "Cancel order"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
