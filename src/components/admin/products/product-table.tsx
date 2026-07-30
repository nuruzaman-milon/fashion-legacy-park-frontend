"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPriceRange } from "@/lib/format";
import type { AdminProductListItem, ProductStatus } from "@/types/admin";
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

/**
 * Products table with the same search/status/category controls the live
 * endpoint accepts as query params — filtering runs locally until then.
 * Deletes only touch local state.
 */
export function ProductTable({
  products,
  categories,
}: {
  products: AdminProductListItem[];
  categories: { id: string; name: string }[];
}) {
  const [items, setItems] = React.useState(products);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>(ALL);
  const [categoryId, setCategoryId] = React.useState<string>(ALL);
  const [toDelete, setToDelete] =
    React.useState<AdminProductListItem | null>(null);

  const categoryOptions = React.useMemo(
    () => [
      { value: ALL, label: "All categories" },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories],
  );

  const query = search.trim().toLowerCase();
  const filtered = items.filter((p) => {
    if (status !== ALL && p.status !== (status as ProductStatus)) return false;
    if (categoryId !== ALL && p.category.id !== categoryId) return false;
    if (
      query &&
      !p.name.toLowerCase().includes(query) &&
      !p.slug.includes(query)
    )
      return false;
    return true;
  });

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
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={status}
          items={STATUS_OPTIONS}
          onValueChange={(v) => setStatus(v ?? ALL)}
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
          items={categoryOptions}
          onValueChange={(v) => setCategoryId(v ?? ALL)}
        >
          <SelectTrigger aria-label="Filter by category" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
          {filtered.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={7}
                className="py-10 text-center text-muted-foreground"
              >
                No products match these filters.
              </TableCell>
            </TableRow>
          )}
          {filtered.map((p) => {
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
                    ? formatPriceRange(Number(p.minPrice), Number(p.maxPrice))
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
                        render={<Link href={`/admin/products/${p.id}/edit`} />}
                      >
                        <PencilIcon className="size-4" />
                        Edit
                      </DropdownMenuLinkItem>
                      <DropdownMenuLinkItem
                        render={
                          <Link href={`/products/${p.slug}`} target="_blank" />
                        }
                      >
                        <ExternalLinkIcon className="size-4" />
                        View in store
                      </DropdownMenuLinkItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive data-highlighted:bg-destructive data-highlighted:text-white"
                        onClick={() => setToDelete(p)}
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

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {items.length} products
      </p>

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete product?</AlertDialogTitle>
          <AlertDialogDescription>
            “{toDelete?.name}” and its variants and images will be removed
            permanently. This is a design preview — nothing is sent to the
            server yet.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                const id = toDelete?.id;
                setToDelete(null);
                if (id) setItems((prev) => prev.filter((p) => p.id !== id));
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
