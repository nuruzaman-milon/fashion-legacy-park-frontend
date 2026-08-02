"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, CheckIcon, FileTextIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormAlert } from "@/components/auth/form-alert";
import { InvoiceDialog } from "@/components/shared/invoice/invoice-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductThumb } from "@/components/product/product-thumb";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminOrderStatusBadge,
  PaymentBadge,
} from "@/components/admin/orders/order-badges";
import {
  getAdminOrder,
  setAdminOrderStatus,
  type AdminOrderDetail,
  type OrderStatusTarget,
} from "@/lib/api/admin/orders";
import type { OrderStatus } from "@/lib/api/orders";
import { ApiError } from "@/lib/api/client";
import { formatDateTime, formatPrice } from "@/lib/format";

/** Mirrors the backend's transition table — buttons the order can act on. */
const NEXT_ACTIONS: Partial<
  Record<OrderStatus, { status: OrderStatusTarget; label: string }[]>
> = {
  PENDING: [{ status: "CONFIRMED", label: "Confirm order" }],
  CONFIRMED: [
    { status: "PROCESSING", label: "Start processing" },
    { status: "SHIPPED", label: "Mark shipped" },
  ],
  PROCESSING: [{ status: "SHIPPED", label: "Mark shipped" }],
  SHIPPED: [{ status: "DELIVERED", label: "Mark delivered" }],
};

const CANCELLABLE: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING"];

export function AdminOrderDetailView({ orderId }: { orderId: string }) {
  const [order, setOrder] = React.useState<AdminOrderDetail | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [invoiceOpen, setInvoiceOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    getAdminOrder(orderId)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError && err.status === 404
              ? "This order no longer exists."
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

  async function move(status: OrderStatusTarget, note?: string) {
    setBusy(true);
    setActionError(null);
    try {
      const updated = await setAdminOrderStatus(orderId, status, note);
      setOrder(updated);
      setCancelOpen(false);
      setCancelReason("");
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Could not update the order. Please try again.",
      );
      setCancelOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <FormAlert>{loadError}</FormAlert>
        <Button variant="outline" render={<Link href="/admin/orders" />}>
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
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  const actions = NEXT_ACTIONS[order.orderStatus] ?? [];
  const cancellable = CANCELLABLE.includes(order.orderStatus);

  return (
    <div className="space-y-5">
      {actionError && <FormAlert>{actionError}</FormAlert>}

      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="font-mono text-lg font-semibold">
            {order.invoiceNo}
          </h2>
          <AdminOrderStatusBadge status={order.orderStatus} />
          <PaymentBadge status={order.paymentStatus} />
          <span className="text-xs text-muted-foreground">
            Placed {formatDateTime(order.createdAt)}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setInvoiceOpen(true)}
            >
              <FileTextIcon data-icon="inline-start" />
              Invoice
            </Button>
            {actions.map((action) => (
              <Button
                key={action.status}
                size="sm"
                disabled={busy}
                onClick={() => void move(action.status)}
              >
                {busy ? "Working…" : action.label}
              </Button>
            ))}
            {cancellable && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                className="text-destructive"
                onClick={() => {
                  setActionError(null);
                  setCancelOpen(true);
                }}
              >
                Cancel order
              </Button>
            )}
          </div>
        </div>
        {order.cancelReason && (
          <p className="mt-2 text-sm text-muted-foreground">
            Cancel reason: {order.cancelReason}
          </p>
        )}

        <ol className="mt-5 space-y-3">
          {order.statusHistory.map((step) => (
            <li key={step.id} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/10">
                <CheckIcon className="size-3 text-brand" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium capitalize">
                  {step.toStatus.toLowerCase()}
                  {step.fromStatus && (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      (from {step.fromStatus.toLowerCase()})
                    </span>
                  )}
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
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.variantName && item.variantName !== "Default"
                    ? `${item.variantName} · `
                    : ""}
                  {item.sku} · {formatPrice(Number(item.unitPrice))} ×{" "}
                  {item.quantity}
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
          <h3 className="font-heading text-base font-medium">
            Customer & delivery
          </h3>
          <p className="mt-3 text-sm font-medium">{order.user.name}</p>
          <p className="text-sm text-muted-foreground">{order.user.email}</p>
          <Separator className="my-3" />
          <p className="text-sm font-medium">{order.shipReceiverName}</p>
          <p className="text-sm text-muted-foreground">
            {order.shipAddress}, {order.shipDistrict}
          </p>
          <p className="text-sm text-muted-foreground">{order.shipPhone}</p>
          {order.note && (
            <p className="mt-3 text-xs text-muted-foreground">
              Customer note: {order.note}
            </p>
          )}
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
            {Number(order.discount) > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                </dt>
                <dd className="font-medium text-emerald-700 dark:text-emerald-400">
                  -{formatPrice(Number(order.discount))}
                </dd>
              </div>
            )}
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
          <p className="mt-2 text-xs text-muted-foreground">
            {order.paymentMethod === "COD"
              ? "Cash on delivery — marked paid automatically on delivery."
              : order.paymentMethod}
          </p>
        </div>
      </div>

      {invoiceOpen && (
        <InvoiceDialog order={order} onClose={() => setInvoiceOpen(false)} />
      )}

      <AlertDialog
        open={cancelOpen}
        onOpenChange={(open) => {
          if (!open && !busy) setCancelOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Cancel order?</AlertDialogTitle>
          <AlertDialogDescription>
            {order.invoiceNo} is cancelled and every item is restocked. The
            customer sees the reason on their timeline.
          </AlertDialogDescription>
          <Input
            aria-label="Cancellation reason"
            placeholder="Reason (optional) — e.g. customer unreachable"
            className="h-10"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" disabled={busy} />}
            >
              Keep order
            </AlertDialogClose>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() =>
                void move("CANCELLED", cancelReason.trim() || undefined)
              }
            >
              {busy ? "Cancelling…" : "Cancel order"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
