"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  EllipsisIcon,
  PencilIcon,
  Trash2Icon,
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
  deleteBrand,
  getAdminBrands,
  type AdminBrand,
} from "@/lib/api/admin/brands";
import { ApiError } from "@/lib/api/client";

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function RowsSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }, (_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </TableCell>
          <TableCell><Skeleton className="ml-auto h-3.5 w-8" /></TableCell>
          <TableCell><Skeleton className="h-5 w-14 rounded-4xl" /></TableCell>
          <TableCell />
        </TableRow>
      ))}
    </>
  );
}

export function BrandTable() {
  const [brands, setBrands] = React.useState<AdminBrand[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [toDelete, setToDelete] = React.useState<AdminBrand | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  const load = React.useCallback(() => {
    return getAdminBrands()
      .then(setBrands)
      .catch((err) => {
        setError(messageOf(err, "Could not load brands. Please try again."));
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
      await deleteBrand(toDelete.id);
      setBrands((prev) => prev?.filter((b) => b.id !== toDelete.id) ?? null);
      setToDelete(null);
    } catch (err) {
      setError(messageOf(err, "Could not delete the brand."));
      setToDelete(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  if (error && brands === null) {
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
            <TableHead>Brand</TableHead>
            <TableHead className="text-right">Products</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands === null && <RowsSkeleton />}
          {brands?.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={4}
                className="py-10 text-center text-muted-foreground"
              >
                No brands yet — create the first one.
              </TableCell>
            </TableRow>
          )}
          {brands?.map((brand) => (
            <TableRow key={brand.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {brand.logo ? (
                    <Image
                      src={brand.logo}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 shrink-0 rounded-md object-contain"
                    />
                  ) : (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium text-muted-foreground">
                      {brand.name[0]}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{brand.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      /{brand.slug}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {brand._count.products}
              </TableCell>
              <TableCell>
                {brand.isActive ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-600/25 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                  >
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Hidden
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${brand.name}`}
                      />
                    }
                  >
                    <EllipsisIcon className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLinkItem
                      render={<Link href={`/admin/brands/${brand.id}/edit`} />}
                    >
                      <PencilIcon className="size-4" />
                      Edit
                    </DropdownMenuLinkItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive data-highlighted:bg-destructive data-highlighted:text-white"
                      onClick={() => setToDelete(brand)}
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
          <AlertDialogTitle>Delete brand?</AlertDialogTitle>
          <AlertDialogDescription>
            {toDelete && toDelete._count.products > 0
              ? `"${toDelete.name}" is on ${toDelete._count.products} ${
                  toDelete._count.products === 1 ? "product" : "products"
                } — they keep selling, just without a brand.`
              : `"${toDelete?.name}" will be removed permanently.`}
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
