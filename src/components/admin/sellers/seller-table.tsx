"use client";

import * as React from "react";
import Link from "next/link";
import {
  BadgeCheckIcon,
  BanIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  PencilIcon,
  SearchIcon,
  XCircleIcon,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormAlert } from "@/components/auth/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  listAdminSellers,
  setSellerStatus,
  type AdminSeller,
  type SellerStatus,
} from "@/lib/api/admin/sellers";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { PaginationMeta } from "@/types/admin";

const ALL = "__all__";

const STATUS_FILTER: { value: string; label: string }[] = [
  { value: ALL, label: "All statuses" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "REJECTED", label: "Rejected" },
];

export const STATUS_LOOKS: Record<
  SellerStatus,
  { label: string; className: string }
> = {
  APPROVED: {
    label: "Approved",
    className:
      "border-emerald-600/25 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  },
  PENDING: {
    label: "Pending",
    className:
      "border-amber-600/25 bg-amber-600/10 text-amber-700 dark:text-amber-400",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
  REJECTED: { label: "Rejected", className: "text-muted-foreground" },
};

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function RowsSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="ml-auto h-3.5 w-10" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-4xl" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
          <TableCell />
        </TableRow>
      ))}
    </>
  );
}

/**
 * Server-driven seller table: search and status map to the query params of
 * `GET /admin/sellers`; pagination comes from its meta.
 */
export function SellerTable() {
  const [result, setResult] = React.useState<{
    key: string;
    data: { items: AdminSeller[]; meta: PaginationMeta };
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>(ALL);
  const [page, setPage] = React.useState(1);
  const [refreshTick, setRefreshTick] = React.useState(0);

  const [toSuspend, setToSuspend] = React.useState<AdminSeller | null>(null);
  const [actionBusy, setActionBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const queryKey = [page, debouncedSearch, status, refreshTick]
    .map(String)
    .join("|");

  React.useEffect(() => {
    let cancelled = false;
    listAdminSellers({
      page,
      search: debouncedSearch || undefined,
      status: status === ALL ? undefined : (status as SellerStatus),
    })
      .then((data) => {
        if (cancelled) return;
        setResult({ key: queryKey, data });
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(messageOf(err, "Could not load sellers. Please try again."));
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, status, refreshTick, queryKey]);

  const loading = !error && result?.key !== queryKey;
  const data = result?.data ?? null;
  const meta = data?.meta;

  const applyFilter = (apply: () => void) => {
    setPage(1);
    apply();
  };

  const refresh = () => setRefreshTick((t) => t + 1);

  async function changeStatus(seller: AdminSeller, next: SellerStatus) {
    setActionBusy(true);
    setActionError(null);
    try {
      await setSellerStatus(seller.id, next);
      setToSuspend(null);
      refresh();
    } catch (err) {
      setActionError(messageOf(err, "Could not change the seller's status."));
      setToSuspend(null);
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search shop, code, email or phone…"
            aria-label="Search sellers"
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
      </div>

      {actionError && <FormAlert>{actionError}</FormAlert>}

      {error ? (
        <div className="space-y-3">
          <FormAlert>{error}</FormAlert>
          <Button variant="outline" size="sm" onClick={refresh}>
            Try again
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Shop</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <RowsSkeleton />}
            {!loading && data?.items.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  {debouncedSearch || status !== ALL
                    ? "No sellers match these filters."
                    : "No sellers yet — invite the first shop."}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              data?.items.map((seller) => {
                const look = STATUS_LOOKS[seller.status];
                return (
                  <TableRow key={seller.id}>
                    <TableCell>
                      <Link
                        href={`/admin/sellers/${seller.id}/edit`}
                        className="block min-w-0"
                      >
                        <p className="truncate font-medium">
                          {seller.shopName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {seller.code}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="truncate text-sm">{seller.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {seller.user.email} · {seller.contactPhone}
                        {!seller.user.isActive && (
                          <span className="text-destructive">
                            {" "}
                            · account deactivated
                          </span>
                        )}
                      </p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(seller.commissionRate)}%
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={look.className}>
                        {look.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(seller.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${seller.shopName}`}
                            />
                          }
                        >
                          <EllipsisIcon className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLinkItem
                            render={
                              <Link
                                href={`/admin/sellers/${seller.id}/edit`}
                              />
                            }
                          >
                            <PencilIcon className="size-4" />
                            Edit
                          </DropdownMenuLinkItem>
                          <DropdownMenuSeparator />
                          {seller.status !== "APPROVED" && (
                            <DropdownMenuItem
                              disabled={actionBusy}
                              onClick={() =>
                                void changeStatus(seller, "APPROVED")
                              }
                            >
                              <BadgeCheckIcon className="size-4" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {seller.status === "PENDING" && (
                            <DropdownMenuItem
                              disabled={actionBusy}
                              onClick={() =>
                                void changeStatus(seller, "REJECTED")
                              }
                            >
                              <XCircleIcon className="size-4" />
                              Reject
                            </DropdownMenuItem>
                          )}
                          {seller.status === "APPROVED" && (
                            <DropdownMenuItem
                              className="text-destructive data-highlighted:bg-destructive data-highlighted:text-white"
                              disabled={actionBusy}
                              onClick={() => {
                                setActionError(null);
                                setToSuspend(seller);
                              }}
                            >
                              <BanIcon className="size-4" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      )}

      {meta && !error && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {meta.total} {meta.total === 1 ? "seller" : "sellers"}
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

      <AlertDialog
        open={toSuspend !== null}
        onOpenChange={(open) => {
          if (!open && !actionBusy) setToSuspend(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Suspend seller?</AlertDialogTitle>
          <AlertDialogDescription>
            {toSuspend &&
              `"${toSuspend.shopName}" and every product they sell disappear from the storefront immediately, and their goods can no longer be bought from carts.`}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" disabled={actionBusy} />}
            >
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              disabled={actionBusy}
              onClick={() => {
                if (toSuspend) void changeStatus(toSuspend, "SUSPENDED");
              }}
            >
              {actionBusy ? "Suspending…" : "Suspend"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
