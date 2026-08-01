"use client";

import * as React from "react";
import Link from "next/link";
import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";

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
import { PhaseBadge, phaseOf } from "@/components/admin/flash-sales/phase";
import {
  deleteFlashSale,
  getAdminFlashSales,
  type AdminFlashSaleListItem,
} from "@/lib/api/admin/flash-sales";
import { ApiError } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function RowsSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }, (_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-3.5 w-44" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-4xl" /></TableCell>
          <TableCell><Skeleton className="ml-auto h-3.5 w-8" /></TableCell>
          <TableCell><Skeleton className="ml-auto h-3.5 w-8" /></TableCell>
          <TableCell />
        </TableRow>
      ))}
    </>
  );
}

export function FlashSaleTable() {
  const [sales, setSales] = React.useState<AdminFlashSaleListItem[] | null>(
    null,
  );
  // Captured when the list arrives — a stable "now" for phase badges (the
  // purity lint bars Date.now() during render).
  const [now, setNow] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [toDelete, setToDelete] =
    React.useState<AdminFlashSaleListItem | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  const load = React.useCallback(() => {
    return getAdminFlashSales()
      .then((items) => {
        setSales(items);
        setNow(Date.now());
      })
      .catch((err) => {
        setError(
          messageOf(err, "Could not load flash sales. Please try again."),
        );
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
      await deleteFlashSale(toDelete.id);
      setSales((prev) => prev?.filter((s) => s.id !== toDelete.id) ?? null);
      setToDelete(null);
    } catch (err) {
      setError(messageOf(err, "Could not delete the flash sale."));
      setToDelete(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  if (error && sales === null) {
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
            <TableHead>Sale</TableHead>
            <TableHead>Window</TableHead>
            <TableHead>Phase</TableHead>
            <TableHead className="text-right">Rules</TableHead>
            <TableHead className="text-right">Items</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales === null && <RowsSkeleton />}
          {sales?.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={6}
                className="py-10 text-center text-muted-foreground"
              >
                No flash sales yet — create the first campaign.
              </TableCell>
            </TableRow>
          )}
          {sales?.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell>
                <Link
                  href={`/admin/flash-sales/${sale.id}/edit`}
                  className="block min-w-0"
                >
                  <p className="truncate font-medium">{sale.title}</p>
                  {sale.description && (
                    <p className="max-w-56 truncate text-xs text-muted-foreground">
                      {sale.description}
                    </p>
                  )}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {formatDateTime(sale.startsAt)}
                <span className="px-1">→</span>
                {formatDateTime(sale.endsAt)}
              </TableCell>
              <TableCell>
                <PhaseBadge phase={phaseOf(sale, now)} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {sale._count.rules}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {sale._count.items}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${sale.title}`}
                      />
                    }
                  >
                    <EllipsisIcon className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLinkItem
                      render={
                        <Link href={`/admin/flash-sales/${sale.id}/edit`} />
                      }
                    >
                      <PencilIcon className="size-4" />
                      Edit
                    </DropdownMenuLinkItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive data-highlighted:bg-destructive data-highlighted:text-white"
                      onClick={() => setToDelete(sale)}
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
          <AlertDialogTitle>Delete flash sale?</AlertDialogTitle>
          <AlertDialogDescription>
            {toDelete && phaseOf(toDelete, now) === "live"
              ? `"${toDelete.title}" is LIVE right now — deleting it takes the discounts off the storefront immediately.`
              : `"${toDelete?.title}" and its rules and items will be removed permanently.`}
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
