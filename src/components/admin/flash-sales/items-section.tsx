"use client";

import * as React from "react";
import { PlusIcon, Trash2Icon, XIcon } from "lucide-react";

import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductSearch } from "@/components/admin/flash-sales/product-search";
import {
  itemToPayload,
  setFlashSaleItems,
  type AdminFlashSaleDetail,
  type AdminFlashSaleItem,
  type FlashSaleItemPayload,
} from "@/lib/api/admin/flash-sales";
import { getProductVariants } from "@/lib/api/admin/products";
import { ApiError } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import type { AdminProductVariant } from "@/types/admin";

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/**
 * Participating variants and their caps. Every change PUTs the full list —
 * the backend diffs it, so live soldCounts survive edits.
 */
export function ItemsSection({
  sale,
  onChanged,
}: {
  sale: AdminFlashSaleDetail;
  onChanged: () => Promise<void> | void;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function putItems(items: FlashSaleItemPayload[], busyKey: string) {
    setBusyId(busyKey);
    setError(null);
    try {
      await setFlashSaleItems(sale.id, items);
      await onChanged();
      return true;
    } catch (err) {
      setError(messageOf(err, "Could not update the sale items."));
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function commitLimit(item: AdminFlashSaleItem) {
    const raw = drafts[item.id];
    if (raw === undefined) return;
    const trimmed = raw.trim();
    const current = item.quantityLimit === null ? "" : String(item.quantityLimit);
    if (trimmed === current) {
      setDrafts((d) => {
        const next = { ...d };
        delete next[item.id];
        return next;
      });
      return;
    }

    let limit: number | null = null;
    if (trimmed !== "") {
      limit = Number(trimmed);
      if (!Number.isInteger(limit) || limit < 1) {
        setError("Limits must be whole numbers of 1 or more — or empty for no cap.");
        return;
      }
    }

    const ok = await putItems(
      sale.items.map((i) =>
        i.id === item.id
          ? { variantId: i.variantId, quantityLimit: limit }
          : itemToPayload(i),
      ),
      item.id,
    );
    if (ok) {
      setDrafts((d) => {
        const next = { ...d };
        delete next[item.id];
        return next;
      });
    }
  }

  function removeItem(item: AdminFlashSaleItem) {
    void putItems(
      sale.items.filter((i) => i.id !== item.id).map(itemToPayload),
      item.id,
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Items</CardTitle>
            <CardDescription>
              The variants selling at flash price, with an optional per-variant
              cap. A variant shows on the storefront only when a rule above
              also prices it.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <PlusIcon data-icon="inline-start" />
            Add items
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <FormAlert>{error}</FormAlert>}

        {sale.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No items yet — the sale is empty until you add variants.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="w-28">Limit</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="truncate font-medium">
                      {item.variant.product.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.variant.name} · {item.variant.sku}
                    </p>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(Number(item.variant.price))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.soldCount}
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={`Quantity limit for ${item.variant.name}`}
                      type="number"
                      min="1"
                      placeholder="No cap"
                      className="h-9 w-24"
                      disabled={busyId === item.id}
                      value={
                        drafts[item.id] ??
                        (item.quantityLimit === null
                          ? ""
                          : String(item.quantityLimit))
                      }
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [item.id]: e.target.value }))
                      }
                      onBlur={() => void commitLimit(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${item.variant.name} from the sale`}
                      disabled={busyId !== null}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {dialogOpen && (
        <AddItemsDialog
          saleId={sale.id}
          existing={sale.items.map(itemToPayload)}
          existingVariantIds={new Set(sale.items.map((i) => i.variantId))}
          onClose={() => setDialogOpen(false)}
          onSaved={onChanged}
        />
      )}
    </Card>
  );
}

function AddItemsDialog({
  saleId,
  existing,
  existingVariantIds,
  onClose,
  onSaved,
}: {
  saleId: string;
  existing: FlashSaleItemPayload[];
  existingVariantIds: Set<string>;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [productPick, setProductPick] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [variants, setVariants] = React.useState<AdminProductVariant[] | null>(
    null,
  );
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function pickProduct(product: { id: string; name: string }) {
    setProductPick(product);
    setVariants(null);
    setSelected(new Set());
    getProductVariants(product.id)
      .then(setVariants)
      .catch(() => setError("Could not load that product's variants."));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const addable =
    variants?.filter((v) => !existingVariantIds.has(v.id)) ?? [];

  async function save() {
    if (selected.size === 0) return;
    setBusy(true);
    setError(null);
    try {
      await setFlashSaleItems(saleId, [
        ...existing,
        ...[...selected].map((variantId) => ({ variantId })),
      ]);
      await onSaved();
      onClose();
    } catch (err) {
      setError(messageOf(err, "Could not add the selected variants."));
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogTitle>Add items</DialogTitle>
        <DialogDescription>
          Find a product, then tick the variants that join the sale. Caps can
          be set afterwards in the table.
        </DialogDescription>

        {error && <FormAlert>{error}</FormAlert>}

        {productPick ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <p className="min-w-0 truncate text-sm font-medium">
              {productPick.name}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Choose a different product"
              onClick={() => {
                setProductPick(null);
                setVariants(null);
                setSelected(new Set());
              }}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        ) : (
          <ProductSearch onPick={pickProduct} />
        )}

        {productPick && variants === null && !error && (
          <p className="text-sm text-muted-foreground">Loading variants…</p>
        )}
        {variants && variants.length === 0 && (
          <p className="text-sm text-muted-foreground">
            This product has no variants yet — nothing to add.
          </p>
        )}
        {variants && variants.length > 0 && (
          <div className="space-y-2">
            {addable.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setSelected(new Set(addable.map((v) => v.id)))}
              >
                Select all {addable.length}
              </Button>
            )}
            <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {variants.map((variant) => {
                const inSale = existingVariantIds.has(variant.id);
                return (
                  <li key={variant.id}>
                    <label
                      className={`flex items-center gap-3 px-3 py-2 ${
                        inSale ? "opacity-60" : "cursor-pointer hover:bg-accent/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={inSale || selected.has(variant.id)}
                        disabled={inSale}
                        onChange={() => toggle(variant.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {variant.name}
                          {!variant.isActive && (
                            <span className="text-muted-foreground">
                              {" "}
                              (inactive)
                            </span>
                          )}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {variant.sku} · stock {variant.stock}
                          {inSale && " · already in sale"}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatPrice(Number(variant.price))}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy || selected.size === 0}
            onClick={() => void save()}
          >
            {busy
              ? "Adding…"
              : selected.size === 0
                ? "Add variants"
                : `Add ${selected.size} ${
                    selected.size === 1 ? "variant" : "variants"
                  }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
