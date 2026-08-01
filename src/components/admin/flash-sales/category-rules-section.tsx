"use client";

import * as React from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

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
import { CategoryCascade } from "@/components/admin/categories/category-cascade";
import { subtreeIds } from "@/components/admin/flash-sales/effective-price";
import { discountSummary } from "@/components/admin/flash-sales/sale-products-section";
import {
  itemToPayload,
  ruleToPayload,
  setFlashSaleItems,
  setFlashSaleRules,
  type AdminFlashSaleDetail,
  type AdminFlashSaleRule,
  type FlashSaleDiscountType,
} from "@/lib/api/admin/flash-sales";
import {
  getProductVariants,
  listAllAdminProducts,
} from "@/lib/api/admin/products";
import { ApiError } from "@/lib/api/client";
import type { AdminCategory } from "@/types/admin";

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

const DISCOUNT_ITEMS = [
  { value: "PERCENTAGE", label: "Percentage (%)" },
  { value: "FIXED", label: "Fixed amount (৳)" },
] as const;

/**
 * Category-wide discounts, plus a safety net listing rules that no longer
 * point at anything in the sale (their product/variant left the item list).
 */
export function CategoryRulesSection({
  sale,
  categories,
  onChanged,
}: {
  sale: AdminFlashSaleDetail;
  categories: AdminCategory[] | null;
  onChanged: () => Promise<void> | void;
}) {
  const [dialog, setDialog] = React.useState<{
    rule: AdminFlashSaleRule | null;
  } | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const categoryRules = sale.rules.filter((r) => r.scope === "CATEGORY");

  // Rules whose target left the item list — invisible in the product table,
  // surfaced here so they can't silently linger.
  const itemVariantIds = new Set(sale.items.map((i) => i.variantId));
  const itemProductIds = new Set(sale.items.map((i) => i.variant.product.id));
  const orphanRules = sale.rules.filter(
    (r) =>
      (r.scope === "PRODUCT" &&
        r.productId !== null &&
        !itemProductIds.has(r.productId)) ||
      (r.scope === "VARIANT" &&
        r.variantId !== null &&
        !itemVariantIds.has(r.variantId)),
  );

  async function removeRule(rule: AdminFlashSaleRule) {
    setBusyId(rule.id);
    setError(null);
    try {
      await setFlashSaleRules(
        sale.id,
        sale.rules.filter((r) => r.id !== rule.id).map(ruleToPayload),
      );
      await onChanged();
    } catch (err) {
      setError(messageOf(err, "Could not remove the rule."));
    } finally {
      setBusyId(null);
    }
  }

  function orphanLabel(rule: AdminFlashSaleRule): string {
    if (rule.scope === "PRODUCT") {
      return rule.product?.name ?? "Deleted product";
    }
    return rule.variant
      ? `${rule.variant.name} · ${rule.variant.sku}`
      : "Deleted variant";
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Category discounts</CardTitle>
            <CardDescription>
              One rule covers every sale product under the category,
              subcategories included. Product discounts above take precedence.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setError(null);
              setDialog({ rule: null });
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Add category discount
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <FormAlert>{error}</FormAlert>}

        {categoryRules.length === 0 && orphanRules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No category-wide discounts.
          </p>
        ) : (
          <>
            {categoryRules.length > 0 && (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {categoryRules.map((rule) => (
                  <li
                    key={rule.id}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {rule.category?.name ?? "Deleted category"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {discountSummary(rule)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit the ${rule.category?.name ?? ""} discount`}
                      disabled={busyId !== null}
                      onClick={() => {
                        setError(null);
                        setDialog({ rule });
                      }}
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove the ${rule.category?.name ?? ""} discount`}
                      disabled={busyId !== null}
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => void removeRule(rule)}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {orphanRules.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Rules pointing outside the sale — their targets are not in
                  the product list, so they do nothing:
                </p>
                <ul className="divide-y divide-border rounded-lg border border-dashed border-border">
                  {orphanRules.map((rule) => (
                    <li
                      key={rule.id}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {rule.scope.toLowerCase()}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{orphanLabel(rule)}</p>
                        <p className="text-xs text-muted-foreground">
                          {discountSummary(rule)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove the unused rule for ${orphanLabel(rule)}`}
                        disabled={busyId !== null}
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => void removeRule(rule)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>

      {dialog && (
        <CategoryRuleDialog
          sale={sale}
          editRule={dialog.rule}
          categories={categories}
          onClose={() => setDialog(null)}
          onSaved={onChanged}
        />
      )}
    </Card>
  );
}

function CategoryRuleDialog({
  sale,
  editRule,
  categories,
  onClose,
  onSaved,
}: {
  sale: AdminFlashSaleDetail;
  editRule: AdminFlashSaleRule | null;
  categories: AdminCategory[] | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [categoryId, setCategoryId] = React.useState<string | null>(
    editRule?.categoryId ?? null,
  );
  const [discountType, setDiscountType] = React.useState<FlashSaleDiscountType>(
    editRule?.discountType ?? "PERCENTAGE",
  );
  const [discountValue, setDiscountValue] = React.useState(
    editRule ? String(Number(editRule.discountValue)) : "",
  );
  const [maxDiscount, setMaxDiscount] = React.useState(
    editRule?.maxDiscount != null ? String(Number(editRule.maxDiscount)) : "",
  );
  // Ticked by default on a new rule — "put Cosmetics on sale" should mean
  // the cosmetics actually show up, not a rule waiting for items.
  const [includeProducts, setIncludeProducts] = React.useState(
    editRule === null,
  );
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  /** Every not-yet-in-sale variant of every product under the category. */
  async function collectSubtreeVariantIds(rootId: string): Promise<string[]> {
    const branch = subtreeIds(rootId, categories ?? []);
    setProgress("Finding products…");
    const products = (await listAllAdminProducts()).filter(
      (p) => branch.has(p.category.id) && p._count.variants > 0,
    );
    if (products.length === 0) return [];
    setProgress(
      `Loading variants of ${products.length} ${
        products.length === 1 ? "product" : "products"
      }…`,
    );
    const variantLists = await Promise.all(
      products.map((p) => getProductVariants(p.id)),
    );
    const inSale = new Set(sale.items.map((i) => i.variantId));
    return variantLists
      .flat()
      .map((v) => v.id)
      .filter((id) => !inSale.has(id));
  }

  async function save() {
    if (!categoryId) {
      setError("Pick a category.");
      return;
    }
    const value = Number(discountValue);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a discount amount above zero.");
      return;
    }
    if (discountType === "PERCENTAGE" && value > 100) {
      setError("A percentage discount cannot exceed 100.");
      return;
    }
    let cap: number | undefined;
    if (discountType === "PERCENTAGE" && maxDiscount.trim() !== "") {
      cap = Number(maxDiscount);
      if (!Number.isFinite(cap) || cap <= 0) {
        setError("The cap must be a positive amount.");
        return;
      }
    }

    setBusy(true);
    setError(null);
    try {
      await setFlashSaleRules(sale.id, [
        ...sale.rules
          .filter((r) => r.id !== editRule?.id)
          .map(ruleToPayload),
        {
          scope: "CATEGORY",
          categoryId,
          discountType,
          discountValue: value,
          ...(cap !== undefined && { maxDiscount: cap }),
        },
      ]);

      if (includeProducts) {
        const newVariantIds = await collectSubtreeVariantIds(categoryId);
        if (newVariantIds.length > 0) {
          setProgress(
            `Adding ${newVariantIds.length} ${
              newVariantIds.length === 1 ? "variant" : "variants"
            }…`,
          );
          await setFlashSaleItems(sale.id, [
            ...sale.items.map(itemToPayload),
            ...newVariantIds.map((variantId) => ({ variantId })),
          ]);
        }
      }

      await onSaved();
      onClose();
    } catch (err) {
      setError(messageOf(err, "Could not save the discount."));
      setBusy(false);
      setProgress(null);
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
        <DialogTitle>
          {editRule ? "Edit category discount" : "Add category discount"}
        </DialogTitle>
        <DialogDescription>
          Applies to every sale product under the category — a product
          discount above always wins over this.
        </DialogDescription>

        {error && <FormAlert>{error}</FormAlert>}

        {categories === null ? (
          <p className="text-sm text-muted-foreground">Loading categories…</p>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Category</p>
            <CategoryCascade
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="crd-type">
              Discount
            </label>
            <Select
              value={discountType}
              items={[...DISCOUNT_ITEMS]}
              onValueChange={(v) => {
                if (v) setDiscountType(v as FlashSaleDiscountType);
              }}
            >
              <SelectTrigger id="crd-type" className="h-10 w-full">
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
            <label className="text-sm font-medium" htmlFor="crd-value">
              {discountType === "PERCENTAGE" ? "Percent off" : "Amount off (৳)"}
            </label>
            <Input
              id="crd-value"
              type="number"
              min="0"
              step="0.01"
              className="h-10"
              placeholder={discountType === "PERCENTAGE" ? "10" : "200"}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
          </div>
          {discountType === "PERCENTAGE" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="crd-cap">
                Cap (৳){" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="crd-cap"
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

        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-primary"
            checked={includeProducts}
            onChange={(e) => setIncludeProducts(e.target.checked)}
          />
          <span className="text-sm">
            <span className="block font-medium">
              Add this category&apos;s products to the sale
            </span>
            <span className="text-muted-foreground">
              Every variant under the category (subcategories included) joins
              the item list — trim or cap them afterwards in Products on sale.
            </span>
          </span>
        </label>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="button" disabled={busy} onClick={() => void save()}>
            {busy ? (progress ?? "Saving…") : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
