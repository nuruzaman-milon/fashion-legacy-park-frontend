"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  PencilIcon,
  SearchIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";

import { ProductStatusBadge } from "@/components/admin/products/product-status-badge";
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
  categoryPathLabel,
  getAdminCategories,
} from "@/lib/api/admin/categories";
import {
  deleteProduct,
  listAdminProducts,
} from "@/lib/api/admin/products";
import { ApiError } from "@/lib/api/client";
import { formatPriceRange } from "@/lib/format";
import type {
  AdminProductListItem,
  PaginationMeta,
  ProductStatus,
} from "@/types/admin";
import { cn } from "@/lib/utils";

const ALL = "__all__";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: ALL, label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending approval" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "REJECTED", label: "Rejected" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
];

function RowsSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-10 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-44" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16 rounded-4xl" /></TableCell>
          <TableCell><Skeleton className="ml-auto h-3.5 w-16" /></TableCell>
          <TableCell><Skeleton className="ml-auto h-3.5 w-8" /></TableCell>
          <TableCell><Skeleton className="ml-auto h-3.5 w-10" /></TableCell>
          <TableCell />
        </TableRow>
      ))}
    </>
  );
}

/**
 * Server-driven products table: search, status and category map straight to
 * the query params of `GET /admin/products`; pagination comes from its meta.
 */
export function ProductTable() {
  // The fetch result remembers which query it answered; "loading" is derived
  // (result key ≠ current key) instead of set synchronously in the effect.
  const [result, setResult] = React.useState<{
    key: string;
    data: { items: AdminProductListItem[]; meta: PaginationMeta };
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [categories, setCategories] = React.useState<
    { value: string; label: string }[]
  >([{ value: ALL, label: "All categories" }]);

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>(ALL);
  const [categoryId, setCategoryId] = React.useState<string>(ALL);
  const [page, setPage] = React.useState(1);

  const [toDelete, setToDelete] =
    React.useState<AdminProductListItem | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [refreshTick, setRefreshTick] = React.useState(0);

  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(handle);
  }, [search]);

  // Filter labels for the category dropdown — child rows get a parent prefix.
  React.useEffect(() => {
    let cancelled = false;
    getAdminCategories()
      .then((list) => {
        if (cancelled) return;
        setCategories([
          { value: ALL, label: "All categories" },
          ...list.map((c) => ({
            value: c.id,
            label: categoryPathLabel(c, list),
          })),
        ]);
      })
      .catch(() => {
        // The filter degrades to "All categories"; the table still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const queryKey = [page, debouncedSearch, status, categoryId, refreshTick]
    .map(String)
    .join("|");

  React.useEffect(() => {
    let cancelled = false;
    listAdminProducts({
      page,
      search: debouncedSearch || undefined,
      status: status === ALL ? undefined : (status as ProductStatus),
      categoryId: categoryId === ALL ? undefined : categoryId,
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
            : "Could not load products. Please try again.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, status, categoryId, refreshTick, queryKey]);

  const loading = !error && result?.key !== queryKey;
  const data = result?.data ?? null;

  // Filters reset paging — page 5 of "Active" makes no sense after switching.
  const applyFilter = (apply: () => void) => {
    setPage(1);
    apply();
  };

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteProduct(toDelete.id);
      setToDelete(null);
      setRefreshTick((t) => t + 1);
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : "Could not delete the product. Please try again.",
      );
    } finally {
      setDeleteBusy(false);
    }
  }

  const meta = data?.meta;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search name, slug or SKU…"
            aria-label="Search products"
            className="h-9 pl-8"
            value={search}
            onChange={(e) => applyFilter(() => setSearch(e.target.value))}
          />
        </div>
        <Select
          value={status}
          items={STATUS_OPTIONS}
          onValueChange={(v) => applyFilter(() => setStatus(v ?? ALL))}
        >
          <SelectTrigger aria-label="Filter by status" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={categoryId}
          items={categories}
          onValueChange={(v) => applyFilter(() => setCategoryId(v ?? ALL))}
        >
          <SelectTrigger aria-label="Filter by category" className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="space-y-3">
          <FormAlert>{error}</FormAlert>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError(null);
              setRefreshTick((t) => t + 1);
            }}
          >
            Try again
          </Button>
        </div>
      )}

      {!error && (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Sold</TableHead>
              <TableHead className="w-10" />
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
                  No products match these filters.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              data?.items.map((p) => {
                const primary =
                  p.images.find((img) => img.isPrimary) ?? p.images[0];
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {primary ? (
                          <Image
                            src={primary.url}
                            alt=""
                            width={40}
                            height={48}
                            className="h-12 w-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-12 w-10 shrink-0 rounded-md bg-muted" />
                        )}
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-medium">
                            <span className="max-w-56 truncate">{p.name}</span>
                            {p.isFeatured && (
                              <StarIcon
                                aria-label="Featured"
                                className="size-3.5 shrink-0 fill-brand text-brand"
                              />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p._count.variants}{" "}
                            {p._count.variants === 1 ? "variant" : "variants"}
                            {p.seller && ` · ${p.seller.shopName}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.category.name}
                    </TableCell>
                    <TableCell>
                      <ProductStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {p.minPrice
                        ? formatPriceRange(
                            Number(p.minPrice),
                            Number(p.maxPrice),
                          )
                        : "—"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        p.totalStock === 0 && "font-medium text-destructive",
                      )}
                    >
                      {p.totalStock}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {p.soldCount}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${p.name}`}
                            />
                          }
                        >
                          <EllipsisIcon className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLinkItem
                            render={
                              <Link href={`/admin/products/${p.id}/edit`} />
                            }
                          >
                            <PencilIcon className="size-4" />
                            Edit
                          </DropdownMenuLinkItem>
                          <DropdownMenuLinkItem
                            render={
                              <Link
                                href={`/products/${p.slug}`}
                                target="_blank"
                              />
                            }
                          >
                            <ExternalLinkIcon className="size-4" />
                            View in store
                          </DropdownMenuLinkItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive data-highlighted:bg-destructive data-highlighted:text-white"
                            onClick={() => {
                              setDeleteError(null);
                              setToDelete(p);
                            }}
                          >
                            <Trash2Icon className="size-4" />
                            Delete
                          </DropdownMenuItem>
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
            {meta.total} {meta.total === 1 ? "product" : "products"}
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
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteBusy) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete product?</AlertDialogTitle>
          <AlertDialogDescription>
            “{toDelete?.name}” and its variants and images will be removed
            permanently.
          </AlertDialogDescription>
          {deleteError && <FormAlert>{deleteError}</FormAlert>}
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
