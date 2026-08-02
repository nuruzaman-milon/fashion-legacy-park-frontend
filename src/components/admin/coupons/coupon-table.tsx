"use client";

import * as React from "react";
import Link from "next/link";
import { CopyIcon, EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  CouponStatusBadge,
  statusOf,
} from "@/components/admin/coupons/coupon-status";
import {
  deleteCoupon,
  getAdminCoupons,
  type AdminCoupon,
  type AdminCouponListItem,
} from "@/lib/api/admin/coupons";
import { ApiError } from "@/lib/api/client";
import { formatDateTime, formatPrice } from "@/lib/format";

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function discountLabel(coupon: AdminCoupon): string {
  if (coupon.discountType === "FREE_SHIPPING") return "Free shipping";
  if (coupon.discountType === "PERCENTAGE") {
    const cap = coupon.maximumDiscount
      ? ` · cap ${formatPrice(Number(coupon.maximumDiscount))}`
      : "";
    return `${Number(coupon.discountValue)}% off${cap}`;
  }
  return `${formatPrice(Number(coupon.discountValue))} off`;
}

function scopeLabel(count: { categories: number; products: number }): string {
  const parts = [
    count.categories > 0 &&
      `${count.categories} ${count.categories === 1 ? "category" : "categories"}`,
    count.products > 0 &&
      `${count.products} ${count.products === 1 ? "product" : "products"}`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Store-wide";
}

function windowLabel(coupon: AdminCoupon): string {
  if (coupon.startsAt && coupon.expiresAt) {
    return `${formatDateTime(coupon.startsAt)} → ${formatDateTime(coupon.expiresAt)}`;
  }
  if (coupon.startsAt) return `From ${formatDateTime(coupon.startsAt)}`;
  if (coupon.expiresAt) return `Until ${formatDateTime(coupon.expiresAt)}`;
  return "Always on";
}

function RowsSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }, (_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-3.5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-40" /></TableCell>
          <TableCell><Skeleton className="ml-auto h-3.5 w-10" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-4xl" /></TableCell>
          <TableCell />
        </TableRow>
      ))}
    </>
  );
}

export function CouponTable() {
  const [coupons, setCoupons] = React.useState<AdminCouponListItem[] | null>(
    null,
  );
  // Captured when the list arrives — a stable "now" for status badges (the
  // purity lint bars Date.now() during render).
  const [now, setNow] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [toDelete, setToDelete] =
    React.useState<AdminCouponListItem | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  const load = React.useCallback(() => {
    return getAdminCoupons()
      .then((items) => {
        setCoupons(items);
        setNow(Date.now());
      })
      .catch((err) => {
        setError(messageOf(err, "Could not load coupons. Please try again."));
      });
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleteBusy(true);
    setError(null);
    try {
      await deleteCoupon(toDelete.id);
      setCoupons((prev) => prev?.filter((c) => c.id !== toDelete.id) ?? null);
      setToDelete(null);
    } catch (err) {
      setError(messageOf(err, "Could not delete the coupon."));
      setToDelete(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  if (error && coupons === null) {
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

  return (
    <>
      {error && <FormAlert>{error}</FormAlert>}

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Coupon</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Window</TableHead>
            <TableHead className="text-right">Used</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {coupons === null && <RowsSkeleton />}
          {coupons?.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={7}
                className="py-10 text-center text-muted-foreground"
              >
                No coupons yet — create the first code.
              </TableCell>
            </TableRow>
          )}
          {coupons?.map((coupon) => (
            <TableRow key={coupon.id}>
              <TableCell>
                <Link
                  href={`/admin/coupons/${coupon.id}/edit`}
                  className="block min-w-0"
                >
                  <p className="truncate font-medium">{coupon.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {coupon.code}
                  </p>
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm">
                {discountLabel(coupon)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {scopeLabel(coupon._count)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {windowLabel(coupon)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {coupon.usedCount}
                {coupon.totalUsageLimit !== null && (
                  <span className="text-muted-foreground">
                    {" "}/ {coupon.totalUsageLimit}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <CouponStatusBadge status={statusOf(coupon, now)} />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${coupon.name}`}
                      />
                    }
                  >
                    <EllipsisIcon className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLinkItem
                      render={<Link href={`/admin/coupons/${coupon.id}/edit`} />}
                    >
                      <PencilIcon className="size-4" />
                      Edit
                    </DropdownMenuLinkItem>
                    <DropdownMenuItem
                      onClick={() => {
                        void navigator.clipboard.writeText(coupon.code);
                      }}
                    >
                      <CopyIcon className="size-4" />
                      Copy code
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive data-highlighted:bg-destructive data-highlighted:text-white"
                      onClick={() => setToDelete(coupon)}
                    >
                      <Trash2Icon className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteBusy) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete coupon?</AlertDialogTitle>
          <AlertDialogDescription>
            {toDelete && statusOf(toDelete, now) === "live"
              ? `"${toDelete.code}" is LIVE right now — deleting it stops customers applying it immediately. Past orders keep their recorded discount.`
              : `"${toDelete?.code}" and its redemption history will be removed permanently. Past orders keep their recorded discount.`}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" disabled={deleteBusy} />}
            >
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              disabled={deleteBusy}
              onClick={() => void confirmDelete()}
            >
              {deleteBusy ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
