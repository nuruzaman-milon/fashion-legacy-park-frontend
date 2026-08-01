"use client";

import * as React from "react";
import {
  AlertTriangleIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  applyDiscount,
  buildParentMap,
  effectiveDeal,
} from "@/components/admin/flash-sales/effective-price";
import { ProductSearch } from "@/components/admin/flash-sales/product-search";
import {
  itemToPayload,
  ruleToPayload,
  setFlashSaleItems,
  setFlashSaleRules,
  type AdminFlashSaleDetail,
  type AdminFlashSaleItem,
  type AdminFlashSaleRule,
  type FlashSaleDiscountType,
  type FlashSaleRulePayload,
} from "@/lib/api/admin/flash-sales";
import { getProductVariants } from "@/lib/api/admin/products";
import { ApiError } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import type { AdminCategory, AdminProductVariant } from "@/types/admin";

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

interface ProductGroup {
  product: { id: string; name: string; slug: string; categoryId: string };
  items: AdminFlashSaleItem[];
  /** The product-scope rule that prices this group, if one exists. */
  rule: AdminFlashSaleRule | null;
}

export function discountSummary(rule: AdminFlashSaleRule): string {
  if (rule.discountType === "PERCENTAGE") {
    const base = `${Number(rule.discountValue)}% off`;
    return rule.maxDiscount !== null
      ? `${base}, capped at ${formatPrice(Number(rule.maxDiscount))}`
      : base;
  }
  return `${formatPrice(Number(rule.discountValue))} off`;
}

const DISCOUNT_ITEMS = [
  { value: "PERCENTAGE", label: "Percentage (%)" },
  { value: "FIXED", label: "Fixed amount (৳)" },
] as const;

/**
 * The sale's product list — one place to put a product on sale: pick it,
 * set its discount and tick the variants, in a single dialog. Under the
 * hood this maintains a PRODUCT-scope rule plus the item rows; the table
 * shows the exact resolved storefront price per variant.
 */
export function SaleProductsSection({
  sale,
  categories,
  onChanged,
  autoAdd = false,
}: {
  sale: AdminFlashSaleDetail;
  categories: AdminCategory[] | null;
  onChanged: () => Promise<void> | void;
  autoAdd?: boolean;
}) {
  const [dialog, setDialog] = React.useState<
    { group: ProductGroup | null } | null
  >(autoAdd ? { group: null } : null);
  const [confirmRemove, setConfirmRemove] =
    React.useState<ProductGroup | null>(null);
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const parentOf = React.useMemo(
    () => buildParentMap(categories ?? []),
    [categories],
  );

  const groups = React.useMemo(() => {
    const map = new Map<string, ProductGroup>();
    for (const item of sale.items) {
      const { product } = item.variant;
      let group = map.get(product.id);
      if (!group) {
        group = { product, items: [], rule: null };
        map.set(product.id, group);
      }
      group.items.push(item);
    }
    for (const group of map.values()) {
      group.rule =
        sale.rules.find(
          (r) => r.scope === "PRODUCT" && r.productId === group.product.id,
        ) ?? null;
    }
    return [...map.values()];
  }, [sale]);

  async function run(key: string, fn: () => Promise<void>, fallback: string) {
    setBusyKey(key);
    setError(null);
    try {
      await fn();
      await onChanged();
      return true;
    } catch (err) {
      setError(messageOf(err, fallback));
      return false;
    } finally {
      setBusyKey(null);
    }
  }

  function removeProduct(group: ProductGroup) {
    const variantIds = new Set(group.items.map((i) => i.variantId));
    void run(
      `product:${group.product.id}`,
      async () => {
        await setFlashSaleRules(
          sale.id,
          sale.rules
            .filter(
              (r) =>
                !(r.scope === "PRODUCT" && r.productId === group.product.id) &&
                !(
                  r.scope === "VARIANT" &&
                  r.variantId !== null &&
                  variantIds.has(r.variantId)
                ),
            )
            .map(ruleToPayload),
        );
        await setFlashSaleItems(
          sale.id,
          sale.items
            .filter((i) => !variantIds.has(i.variantId))
            .map(itemToPayload),
        );
      },
      "Could not remove the product from the sale.",
    ).then((ok) => {
      if (ok) setConfirmRemove(null);
    });
  }

  function removeVariant(item: AdminFlashSaleItem) {
    const hasVariantRule = sale.rules.some(
      (r) => r.scope === "VARIANT" && r.variantId === item.variantId,
    );
    void run(
      item.id,
      async () => {
        if (hasVariantRule) {
          await setFlashSaleRules(
            sale.id,
            sale.rules
              .filter(
                (r) =>
                  !(r.scope === "VARIANT" && r.variantId === item.variantId),
              )
              .map(ruleToPayload),
          );
        }
        await setFlashSaleItems(
          sale.id,
          sale.items
            .filter((i) => i.id !== item.id)
            .map(itemToPayload),
        );
      },
      "Could not remove the variant.",
    );
  }

  function clearVariantRule(item: AdminFlashSaleItem) {
    void run(
      `rule:${item.variantId}`,
      () =>
        setFlashSaleRules(
          sale.id,
          sale.rules
            .filter(
              (r) => !(r.scope === "VARIANT" && r.variantId === item.variantId),
            )
            .map(ruleToPayload),
        ),
      "Could not clear the custom discount.",
    );
  }

  // Limit edits stage locally; one Save button flushes them in a single PUT.
  const isDirty = React.useCallback(
    (item: AdminFlashSaleItem) => {
      const raw = drafts[item.id];
      if (raw === undefined) return false;
      const current =
        item.quantityLimit === null ? "" : String(item.quantityLimit);
      return raw.trim() !== current;
    },
    [drafts],
  );

  const dirtyCount = sale.items.filter(isDirty).length;

  async function saveLimits() {
    const changes = new Map<string, number | null>();
    for (const item of sale.items) {
      if (!isDirty(item)) continue;
      const trimmed = drafts[item.id].trim();
      if (trimmed === "") {
        changes.set(item.id, null);
        continue;
      }
      const limit = Number(trimmed);
      if (!Number.isInteger(limit) || limit < 1) {
        setError(
          `"${item.variant.name}" — limits must be whole numbers of 1 or more, or empty for no cap.`,
        );
        return;
      }
      changes.set(item.id, limit);
    }
    if (changes.size === 0) {
      setDrafts({});
      return;
    }

    const ok = await run(
      "limits",
      () =>
        setFlashSaleItems(
          sale.id,
          sale.items.map((i) =>
            changes.has(i.id)
              ? { variantId: i.variantId, quantityLimit: changes.get(i.id)! }
              : itemToPayload(i),
          ),
        ),
      "Could not save the limits.",
    );
    if (ok) setDrafts({});
  }

  /** The dialog's save — replace the product rule, append new variants. */
  async function saveProduct(
    product: { id: string },
    rule: FlashSaleRulePayload,
    addVariantIds: string[],
  ) {
    await setFlashSaleRules(sale.id, [
      ...sale.rules
        .filter((r) => !(r.scope === "PRODUCT" && r.productId === product.id))
        .map(ruleToPayload),
      rule,
    ]);
    if (addVariantIds.length > 0) {
      await setFlashSaleItems(sale.id, [
        ...sale.items.map(itemToPayload),
        ...addVariantIds.map((variantId) => ({ variantId })),
      ]);
    }
    await onChanged();
  }

  const busy = busyKey !== null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Products on sale</CardTitle>
            <CardDescription>
              Pick a product, set its discount and choose the variants — in
              one step. The flash price shown is exactly what shoppers pay.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialog({ group: null })}>
            <PlusIcon data-icon="inline-start" />
            Add products
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <FormAlert>{error}</FormAlert>}

        {groups.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Nothing is on sale yet — add the first product.
          </p>
        )}

        {groups.map((group) => (
          <div
            key={group.product.id}
            className="overflow-hidden rounded-lg border border-border"
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
              <p className="min-w-0 flex-1 truncate text-sm font-medium">
                {group.product.name}
              </p>
              {group.rule ? (
                <Badge variant="outline" className="shrink-0">
                  {discountSummary(group.rule)}
                </Badge>
              ) : group.items.every((i) =>
                  effectiveDeal(i, sale.rules, parentOf),
                ) ? (
                <Badge
                  variant="outline"
                  className="shrink-0 text-muted-foreground"
                >
                  via category discount
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="shrink-0 border-amber-600/25 bg-amber-600/10 text-amber-700 dark:text-amber-400"
                >
                  No product discount
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${group.product.name} in this sale`}
                disabled={busy}
                onClick={() => setDialog({ group })}
              >
                <PencilIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${group.product.name} from the sale`}
                disabled={busy}
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setConfirmRemove(group)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>

            <ul className="divide-y divide-border">
              {group.items.map((item) => {
                const deal = effectiveDeal(item, sale.rules, parentOf);
                const regular = Number(item.variant.price);
                return (
                  <li
                    key={item.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_7rem_8rem_4rem_6.5rem_2rem]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{item.variant.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.variant.sku}
                      </p>
                    </div>
                    <p className="text-right text-sm text-muted-foreground tabular-nums line-through decoration-muted-foreground/60 sm:order-none">
                      {formatPrice(regular)}
                    </p>
                    <div className="text-right sm:order-none">
                      {deal ? (
                        <>
                          <p className="text-sm font-semibold tabular-nums">
                            {formatPrice(deal.price)}
                          </p>
                          {deal.rule.scope === "VARIANT" && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => clearVariantRule(item)}
                              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                              title="This variant has its own rule — click to remove it"
                            >
                              custom ×
                            </button>
                          )}
                          {deal.rule.scope === "CATEGORY" && (
                            <p className="text-xs text-muted-foreground">
                              via category
                            </p>
                          )}
                        </>
                      ) : (
                        <p
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400"
                          title="No rule prices this variant, so the storefront hides it"
                        >
                          <AlertTriangleIcon className="size-3.5" />
                          no discount
                        </p>
                      )}
                    </div>
                    <p className="text-right text-xs text-muted-foreground tabular-nums">
                      {item.soldCount} sold
                    </p>
                    <Input
                      aria-label={`Quantity limit for ${item.variant.name}`}
                      type="number"
                      min="1"
                      placeholder="No cap"
                      className={`h-8 w-full sm:w-24 ${
                        isDirty(item) ? "border-brand" : ""
                      }`}
                      disabled={busyKey === "limits"}
                      value={
                        drafts[item.id] ??
                        (item.quantityLimit === null
                          ? ""
                          : String(item.quantityLimit))
                      }
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [item.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void saveLimits();
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${item.variant.name} from the sale`}
                      disabled={busy}
                      className="justify-self-end text-muted-foreground hover:text-destructive"
                      onClick={() => removeVariant(item)}
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {dirtyCount > 0 && (
          <div className="sticky bottom-3 flex items-center justify-between gap-3 rounded-lg border border-brand/40 bg-background/95 px-3 py-2 shadow-sm backdrop-blur">
            <p className="text-sm text-muted-foreground">
              {dirtyCount} unsaved limit{dirtyCount === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setError(null);
                  setDrafts({});
                }}
              >
                Discard
              </Button>
              <Button size="sm" disabled={busy} onClick={() => void saveLimits()}>
                {busyKey === "limits" ? "Saving…" : "Save limits"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {dialog && (
        <ProductSaleDialog
          group={dialog.group}
          saleVariantIds={new Set(sale.items.map((i) => i.variantId))}
          onClose={() => setDialog(null)}
          onSave={saveProduct}
        />
      )}

      <AlertDialog
        open={confirmRemove !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirmRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Remove product from sale?</AlertDialogTitle>
          <AlertDialogDescription>
            {confirmRemove &&
              `"${confirmRemove.product.name}" and its ${
                confirmRemove.items.length
              } ${
                confirmRemove.items.length === 1 ? "variant" : "variants"
              } leave the sale, along with its discount.`}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" disabled={busy} />}
            >
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => {
                if (confirmRemove) removeProduct(confirmRemove);
              }}
            >
              {busy ? "Removing…" : "Remove"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/**
 * Add a product to the sale, or edit one already in it — product, discount
 * and variant selection in a single step, with the resulting price previewed
 * live on every row.
 */
function ProductSaleDialog({
  group,
  saleVariantIds,
  onClose,
  onSave,
}: {
  group: ProductGroup | null;
  saleVariantIds: Set<string>;
  onClose: () => void;
  onSave: (
    product: { id: string },
    rule: FlashSaleRulePayload,
    addVariantIds: string[],
  ) => Promise<void>;
}) {
  const [product, setProduct] = React.useState<{
    id: string;
    name: string;
  } | null>(group ? group.product : null);
  const [variants, setVariants] = React.useState<AdminProductVariant[] | null>(
    null,
  );
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [discountType, setDiscountType] = React.useState<FlashSaleDiscountType>(
    group?.rule?.discountType ?? "PERCENTAGE",
  );
  const [discountValue, setDiscountValue] = React.useState(
    group?.rule ? String(Number(group.rule.discountValue)) : "",
  );
  const [maxDiscount, setMaxDiscount] = React.useState(
    group?.rule?.maxDiscount != null
      ? String(Number(group.rule.maxDiscount))
      : "",
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadVariants = React.useCallback((productId: string) => {
    getProductVariants(productId)
      .then((all) => {
        setVariants(all);
        setSelected(new Set()); // new-variant picks start empty in edit mode
      })
      .catch(() => setError("Could not load that product's variants."));
  }, []);

  // Edit mode opens with the product fixed — its variants load straight away.
  React.useEffect(() => {
    if (group) loadVariants(group.product.id);
  }, [group, loadVariants]);

  function pickProduct(p: { id: string; name: string }) {
    setProduct(p);
    setVariants(null);
    getProductVariants(p.id)
      .then((all) => {
        setVariants(all);
        // Everything not yet in the sale starts ticked — adding the whole
        // product is the common case; untick to exclude.
        setSelected(
          new Set(
            all.filter((v) => !saleVariantIds.has(v.id)).map((v) => v.id),
          ),
        );
      })
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

  const value = Number(discountValue);
  const cap =
    discountType === "PERCENTAGE" && maxDiscount.trim() !== ""
      ? Number(maxDiscount)
      : null;
  const previewReady =
    discountValue.trim() !== "" && Number.isFinite(value) && value > 0;

  function preview(price: string): string | null {
    if (!previewReady) return null;
    return formatPrice(
      applyDiscount(Number(price), {
        discountType,
        discountValue: value,
        maxDiscount: cap,
      }),
    );
  }

  async function save() {
    if (!product) {
      setError("Pick a product first.");
      return;
    }
    if (!previewReady) {
      setError("Enter a discount amount above zero.");
      return;
    }
    if (discountType === "PERCENTAGE" && value > 100) {
      setError("A percentage discount cannot exceed 100.");
      return;
    }
    if (cap !== null && (!Number.isFinite(cap) || cap <= 0)) {
      setError("The cap must be a positive amount.");
      return;
    }
    const inSaleCount =
      variants?.filter((v) => saleVariantIds.has(v.id)).length ?? 0;
    if (inSaleCount === 0 && selected.size === 0) {
      setError("Tick at least one variant.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onSave(
        product,
        {
          scope: "PRODUCT",
          productId: product.id,
          discountType,
          discountValue: value,
          ...(cap !== null && { maxDiscount: cap }),
        },
        [...selected],
      );
      onClose();
    } catch (err) {
      setError(messageOf(err, "Could not save. Please try again."));
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
      <DialogContent className="max-w-xl">
        <DialogTitle>
          {group ? `Edit ${group.product.name}` : "Add products"}
        </DialogTitle>
        <DialogDescription>
          {group
            ? "Change the discount, or tick more variants to include."
            : "Find a product, set its discount and tick the variants that join."}
        </DialogDescription>

        {error && <FormAlert>{error}</FormAlert>}

        {product && !group ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
            <p className="min-w-0 truncate text-sm font-medium">
              {product.name}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Choose a different product"
              onClick={() => {
                setProduct(null);
                setVariants(null);
                setSelected(new Set());
              }}
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        ) : null}
        {!product && <ProductSearch onPick={pickProduct} />}

        {product && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="psd-type">
                Discount
              </label>
              <Select
                value={discountType}
                items={[...DISCOUNT_ITEMS]}
                onValueChange={(v) => {
                  if (v) setDiscountType(v as FlashSaleDiscountType);
                }}
              >
                <SelectTrigger id="psd-type" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="psd-value">
                {discountType === "PERCENTAGE" ? "Percent off" : "Amount off (৳)"}
              </label>
              <Input
                id="psd-value"
                type="number"
                min="0"
                step="0.01"
                className="h-10"
                placeholder={discountType === "PERCENTAGE" ? "20" : "300"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
            {discountType === "PERCENTAGE" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="psd-cap">
                  Cap (৳){" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <Input
                  id="psd-cap"
                  type="number"
                  min="0"
                  step="0.01"
                  className="h-10"
                  placeholder="500"
                  value={maxDiscount}
                  onChange={(e) => setMaxDiscount(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {product && variants === null && !error && (
          <p className="text-sm text-muted-foreground">Loading variants…</p>
        )}
        {variants && variants.length === 0 && (
          <p className="text-sm text-muted-foreground">
            This product has no variants yet — nothing to put on sale.
          </p>
        )}
        {variants && variants.length > 0 && (
          <ul className="max-h-60 divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {variants.map((variant) => {
              const inSale = saleVariantIds.has(variant.id);
              const flashPreview = preview(variant.price);
              return (
                <li key={variant.id}>
                  <label
                    className={`flex items-center gap-3 px-3 py-2 ${
                      inSale
                        ? "opacity-60"
                        : "cursor-pointer hover:bg-accent/50"
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
                    <span className="shrink-0 text-right text-xs tabular-nums">
                      <span
                        className={
                          flashPreview
                            ? "text-muted-foreground line-through"
                            : "text-muted-foreground"
                        }
                      >
                        {formatPrice(Number(variant.price))}
                      </span>
                      {flashPreview && (
                        <span className="block font-semibold text-foreground">
                          {flashPreview}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
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
            disabled={busy || !product}
            onClick={() => void save()}
          >
            {busy ? "Saving…" : group ? "Save changes" : "Add to sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
