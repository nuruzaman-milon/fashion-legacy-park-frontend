"use client";

import * as React from "react";
import { PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";

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
import { ProductSearch } from "@/components/admin/flash-sales/product-search";
import {
  categoryPathLabel,
  getAdminCategories,
} from "@/lib/api/admin/categories";
import {
  ruleToPayload,
  setFlashSaleRules,
  type AdminFlashSaleDetail,
  type AdminFlashSaleRule,
  type FlashSaleDiscountType,
  type FlashSaleRulePayload,
  type FlashSaleScope,
} from "@/lib/api/admin/flash-sales";
import { getProductVariants } from "@/lib/api/admin/products";
import { ApiError } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import type { AdminCategory, AdminProductVariant } from "@/types/admin";

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function targetLabel(rule: AdminFlashSaleRule): string {
  switch (rule.scope) {
    case "CATEGORY":
      return rule.category?.name ?? "Deleted category";
    case "PRODUCT":
      return rule.product?.name ?? "Deleted product";
    case "VARIANT":
      return rule.variant
        ? `${rule.variant.name} · ${rule.variant.sku}`
        : "Deleted variant";
  }
}

function discountLabel(rule: AdminFlashSaleRule): string {
  if (rule.discountType === "PERCENTAGE") {
    const base = `${Number(rule.discountValue)}% off`;
    return rule.maxDiscount !== null
      ? `${base}, capped at ${formatPrice(Number(rule.maxDiscount))}`
      : base;
  }
  return `${formatPrice(Number(rule.discountValue))} off`;
}

const SCOPE_ITEMS = [
  { value: "CATEGORY", label: "Category" },
  { value: "PRODUCT", label: "Product" },
  { value: "VARIANT", label: "Variant" },
] as const;

const DISCOUNT_ITEMS = [
  { value: "PERCENTAGE", label: "Percentage (%)" },
  { value: "FIXED", label: "Fixed amount (৳)" },
] as const;

/** Discount rules — who gets what price. Every change PUTs the full set. */
export function RulesSection({
  sale,
  onChanged,
}: {
  sale: AdminFlashSaleDetail;
  onChanged: () => Promise<void> | void;
}) {
  const [dialog, setDialog] = React.useState<{ index: number | null } | null>(
    null,
  );
  const [categories, setCategories] = React.useState<AdminCategory[] | null>(
    null,
  );
  const [busyIndex, setBusyIndex] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const payloads = sale.rules.map(ruleToPayload);

  function openDialog(index: number | null) {
    setError(null);
    setDialog({ index });
    if (categories === null) {
      getAdminCategories().then(setCategories).catch(() => {
        // The dialog shows its own "still loading" note; a retry happens on
        // the next open.
      });
    }
  }

  async function removeRule(index: number) {
    setBusyIndex(index);
    setError(null);
    try {
      await setFlashSaleRules(
        sale.id,
        payloads.filter((_, i) => i !== index),
      );
      await onChanged();
    } catch (err) {
      setError(messageOf(err, "Could not remove the rule."));
    } finally {
      setBusyIndex(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Discount rules</CardTitle>
            <CardDescription>
              What the sale takes off. Variant rules beat product rules beat
              category rules; within a tier the lowest price wins. A rule only
              reaches shoppers through the items below.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => openDialog(null)}>
            <PlusIcon data-icon="inline-start" />
            Add rule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <FormAlert>{error}</FormAlert>}

        {sale.rules.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No rules yet — nothing is discounted until you add one.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {sale.rules.map((rule, index) => (
              <li key={rule.id} className="flex items-center gap-3 px-3 py-2.5">
                <Badge variant="outline" className="shrink-0 capitalize">
                  {rule.scope.toLowerCase()}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {targetLabel(rule)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {discountLabel(rule)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit rule for ${targetLabel(rule)}`}
                  disabled={busyIndex !== null}
                  onClick={() => openDialog(index)}
                >
                  <PencilIcon className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove rule for ${targetLabel(rule)}`}
                  disabled={busyIndex !== null}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => void removeRule(index)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {dialog && (
        <RuleDialog
          saleId={sale.id}
          existing={payloads}
          editIndex={dialog.index}
          editRule={dialog.index !== null ? sale.rules[dialog.index] : null}
          categories={categories}
          onClose={() => setDialog(null)}
          onSaved={onChanged}
        />
      )}
    </Card>
  );
}

function RuleDialog({
  saleId,
  existing,
  editIndex,
  editRule,
  categories,
  onClose,
  onSaved,
}: {
  saleId: string;
  existing: FlashSaleRulePayload[];
  editIndex: number | null;
  editRule: AdminFlashSaleRule | null;
  categories: AdminCategory[] | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [scope, setScope] = React.useState<FlashSaleScope>(
    editRule?.scope ?? "PRODUCT",
  );
  const [categoryId, setCategoryId] = React.useState<string | null>(
    editRule?.categoryId ?? null,
  );
  const [productPick, setProductPick] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [variants, setVariants] = React.useState<AdminProductVariant[] | null>(
    null,
  );
  const [variantId, setVariantId] = React.useState<string | null>(
    editRule?.variantId ?? null,
  );
  // The stored target's display name while editing — cleared when the admin
  // decides to point the rule somewhere else.
  const [keptLabel, setKeptLabel] = React.useState<string | null>(
    editRule && editRule.scope !== "CATEGORY" ? targetLabel(editRule) : null,
  );
  const [discountType, setDiscountType] =
    React.useState<FlashSaleDiscountType>(editRule?.discountType ?? "PERCENTAGE");
  const [discountValue, setDiscountValue] = React.useState(
    editRule ? String(Number(editRule.discountValue)) : "",
  );
  const [maxDiscount, setMaxDiscount] = React.useState(
    editRule?.maxDiscount !== null && editRule?.maxDiscount !== undefined
      ? String(Number(editRule.maxDiscount))
      : "",
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function changeScope(next: FlashSaleScope) {
    setScope(next);
    setCategoryId(null);
    setProductPick(null);
    setVariants(null);
    setVariantId(null);
    setKeptLabel(null);
    setError(null);
  }

  function clearTarget() {
    setProductPick(null);
    setVariants(null);
    setVariantId(null);
    setKeptLabel(null);
  }

  function pickProduct(product: { id: string; name: string }) {
    setProductPick(product);
    setKeptLabel(null);
    if (scope === "VARIANT") {
      setVariants(null);
      setVariantId(null);
      getProductVariants(product.id)
        .then(setVariants)
        .catch(() => setError("Could not load that product's variants."));
    }
  }

  async function save() {
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

    const payload: FlashSaleRulePayload = {
      scope,
      discountType,
      discountValue: value,
      ...(cap !== undefined && { maxDiscount: cap }),
    };
    if (scope === "CATEGORY") {
      if (!categoryId) {
        setError("Pick a category.");
        return;
      }
      payload.categoryId = categoryId;
    } else if (scope === "PRODUCT") {
      const productId = productPick?.id ?? (keptLabel ? editRule?.productId : null);
      if (!productId) {
        setError("Pick a product.");
        return;
      }
      payload.productId = productId;
    } else {
      if (!variantId) {
        setError("Pick a variant.");
        return;
      }
      payload.variantId = variantId;
    }

    const next = [...existing];
    if (editIndex !== null) next[editIndex] = payload;
    else next.push(payload);

    setBusy(true);
    setError(null);
    try {
      await setFlashSaleRules(saleId, next);
      await onSaved();
      onClose();
    } catch (err) {
      setError(messageOf(err, "Could not save the rule."));
      setBusy(false);
    }
  }

  const categoryItems = React.useMemo(() => {
    if (!categories) return [];
    return categories
      .map((c) => ({ value: c.id, label: categoryPathLabel(c, categories) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categories]);

  const variantItems =
    variants?.map((v) => ({
      value: v.id,
      label: `${v.name} — ${v.sku} (${formatPrice(Number(v.price))})`,
    })) ?? [];

  const needsProductPicker =
    scope !== "CATEGORY" && !productPick && !keptLabel;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogTitle>{editRule ? "Edit rule" : "Add rule"}</DialogTitle>
        <DialogDescription>
          Scope the discount to a whole category, one product, or a single
          variant.
        </DialogDescription>

        {error && <FormAlert>{error}</FormAlert>}

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="rule-scope">
                Applies to
              </label>
              <Select
                value={scope}
                items={[...SCOPE_ITEMS]}
                onValueChange={(v) => {
                  if (v) changeScope(v as FlashSaleScope);
                }}
              >
                <SelectTrigger id="rule-scope" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="rule-type">
                Discount type
              </label>
              <Select
                value={discountType}
                items={[...DISCOUNT_ITEMS]}
                onValueChange={(v) => {
                  if (v) setDiscountType(v as FlashSaleDiscountType);
                }}
              >
                <SelectTrigger id="rule-type" className="h-10 w-full">
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
          </div>

          {scope === "CATEGORY" &&
            (categories === null ? (
              <p className="text-sm text-muted-foreground">
                Loading categories…
              </p>
            ) : (
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="rule-category">
                  Category
                </label>
                <Select
                  value={categoryId}
                  items={categoryItems}
                  onValueChange={(v) => {
                    if (v) setCategoryId(v);
                  }}
                >
                  <SelectTrigger id="rule-category" className="h-10 w-full">
                    <SelectValue placeholder="Pick a category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Covers every product underneath it, subcategories included.
                </p>
              </div>
            ))}

          {(productPick || keptLabel) && scope !== "CATEGORY" && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <p className="min-w-0 truncate text-sm font-medium">
                {productPick?.name ?? keptLabel}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Choose a different target"
                onClick={clearTarget}
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          )}
          {needsProductPicker && <ProductSearch onPick={pickProduct} />}

          {scope === "VARIANT" && productPick && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="rule-variant">
                Variant
              </label>
              {variants === null ? (
                <p className="text-sm text-muted-foreground">
                  Loading variants…
                </p>
              ) : (
                <Select
                  value={variantId}
                  items={variantItems}
                  onValueChange={(v) => {
                    if (v) setVariantId(v);
                  }}
                >
                  <SelectTrigger id="rule-variant" className="h-10 w-full">
                    <SelectValue placeholder="Pick a variant…" />
                  </SelectTrigger>
                  <SelectContent>
                    {variantItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="rule-value">
                {discountType === "PERCENTAGE" ? "Percent off" : "Amount off (৳)"}
              </label>
              <Input
                id="rule-value"
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
                <label className="text-sm font-medium" htmlFor="rule-cap">
                  Cap (৳){" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <Input
                  id="rule-cap"
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
        </div>

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
            {busy ? "Saving…" : editRule ? "Save rule" : "Add rule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
