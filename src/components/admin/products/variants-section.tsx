"use client";

import * as React from "react";
import {
  PlusIcon,
  StarIcon,
  Trash2Icon,
  WandSparklesIcon,
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
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCatalogSurface } from "@/components/admin/products/catalog-surface";
import type { VariantPayload } from "@/lib/api/catalog";
import {
  getOptionLibrary,
  type OptionLibraryItem,
} from "@/lib/api/admin/options";
import { ApiError } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import type { AdminProductOption, AdminProductVariant } from "@/types/admin";
import { cn } from "@/lib/utils";

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-sm transition-colors",
        pressed
          ? "border-brand/40 bg-brand/10 text-brand"
          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Attach options (only while the product has no variants)
// ---------------------------------------------------------------------------

function AttachOptions({
  productId,
  attached,
  onOptionsChange,
}: {
  productId: string;
  attached: AdminProductOption[];
  onOptionsChange: (options: AdminProductOption[]) => void;
}) {
  const { api } = useCatalogSurface();
  const [library, setLibrary] = React.useState<OptionLibraryItem[] | null>(
    null,
  );
  const [selected, setSelected] = React.useState<string[]>(() =>
    attached.map((o) => o.optionId),
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getOptionLibrary()
      .then((items) => {
        if (!cancelled) setLibrary(items);
      })
      .catch((err) => {
        if (!cancelled)
          setError(messageOf(err, "Could not load the option library."));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (optionId: string) =>
    setSelected((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : prev.length >= 3
          ? prev
          : [...prev, optionId],
    );

  const dirty =
    selected.join(",") !== attached.map((o) => o.optionId).join(",");

  async function save() {
    setBusy(true);
    setError(null);
    try {
      onOptionsChange(await api.attachProductOptions(productId, selected));
    } catch (err) {
      setError(messageOf(err, "Could not save the options."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
      <div>
        <p className="text-sm font-medium">Options</p>
        <p className="text-xs text-muted-foreground">
          Pick up to 3 axes (e.g. Color + Size), then generate the variants.
        </p>
      </div>
      {error && <FormAlert>{error}</FormAlert>}
      {library === null && !error && (
        <p className="text-sm text-muted-foreground">Loading library…</p>
      )}
      {library && (
        <div className="flex flex-wrap gap-1.5">
          {library.map((option) => (
            <Chip
              key={option.id}
              pressed={selected.includes(option.id)}
              onClick={() => toggle(option.id)}
            >
              {option.name}
              <span className="text-xs opacity-70">
                ({option.values.length})
              </span>
            </Chip>
          ))}
          {library.length === 0 && (
            <p className="text-sm text-muted-foreground">
              The option library is empty — add options under Catalog →
              Options first.
            </p>
          )}
        </div>
      )}
      {dirty && (
        <Button size="sm" disabled={busy || selected.length === 0} onClick={() => void save()}>
          {busy ? "Saving…" : "Save options"}
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generate dialog
// ---------------------------------------------------------------------------

function GenerateDialog({
  productId,
  options,
  onGenerated,
}: {
  productId: string;
  options: AdminProductOption[];
  onGenerated: (variants: AdminProductVariant[]) => void;
}) {
  const { api } = useCatalogSurface();
  const [open, setOpen] = React.useState(false);
  const [picked, setPicked] = React.useState<Record<string, string[]>>({});
  const [price, setPrice] = React.useState("");
  const [stock, setStock] = React.useState("0");
  const [skuPrefix, setSkuPrefix] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const toggleValue = (optionId: string, valueId: string) =>
    setPicked((prev) => {
      const current = prev[optionId] ?? [];
      return {
        ...prev,
        [optionId]: current.includes(valueId)
          ? current.filter((id) => id !== valueId)
          : [...current, valueId],
      };
    });

  const selections = options
    .map((option) => ({
      optionId: option.optionId,
      valueIds: picked[option.optionId] ?? [],
    }))
    .filter((s) => s.valueIds.length > 0);

  const combinations = selections.reduce(
    (n, s) => n * s.valueIds.length,
    selections.length > 0 ? 1 : 0,
  );

  const priceNumber = Number(price);
  const stockNumber = Number(stock);
  const valid =
    selections.length === options.length &&
    combinations > 0 &&
    Number.isFinite(priceNumber) &&
    priceNumber > 0 &&
    Number.isInteger(stockNumber) &&
    stockNumber >= 0 &&
    (skuPrefix === "" || /^[A-Za-z0-9-]{1,20}$/.test(skuPrefix));

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.generateVariants(productId, {
        selections,
        price: priceNumber,
        stock: stockNumber,
        ...(skuPrefix && { skuPrefix }),
      });
      onGenerated(await api.getProductVariants(productId));
      setOpen(false);
      setPicked({});
      if (result.skipped > 0) {
        // Skipped combos already existed — visible in the refreshed table.
      }
    } catch (err) {
      setError(messageOf(err, "Could not generate variants."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <WandSparklesIcon className="size-3.5" />
        Generate
      </Button>
      <DialogContent className="max-w-lg">
        <DialogTitle>Generate variants</DialogTitle>
        {error && <FormAlert>{error}</FormAlert>}
        <div className="space-y-4">
          {options.map((option) => (
            <div key={option.id} className="space-y-1.5">
              <p className="text-sm font-medium">{option.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {option.values.map((value) => (
                  <Chip
                    key={value.id}
                    pressed={(picked[option.optionId] ?? []).includes(value.id)}
                    onClick={() => toggleValue(option.optionId, value.id)}
                  >
                    {value.hexColor && (
                      <span
                        aria-hidden
                        className="size-2.5 rounded-full border border-foreground/20"
                        style={{ backgroundColor: value.hexColor }}
                      />
                    )}
                    {value.value}
                  </Chip>
                ))}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="gen-price" className="text-sm font-medium">
                Price (৳)
              </label>
              <Input
                id="gen-price"
                type="number"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="gen-stock" className="text-sm font-medium">
                Stock each
              </label>
              <Input
                id="gen-stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="gen-sku" className="text-sm font-medium">
              SKU prefix{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Input
              id="gen-sku"
              placeholder="GOWN"
              value={skuPrefix}
              onChange={(e) => setSkuPrefix(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {combinations > 0
              ? `${combinations} ${combinations === 1 ? "combination" : "combinations"} — existing ones are skipped, price and stock can be edited per variant afterwards.`
              : "Pick at least one value per option."}
          </p>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={busy} />}>
            Cancel
          </DialogClose>
          <Button disabled={!valid || busy} onClick={() => void generate()}>
            {busy ? "Generating…" : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit-variant dialog
// ---------------------------------------------------------------------------

function EditVariantDialog({
  variant,
  onClose,
  onSaved,
}: {
  variant: AdminProductVariant | null;
  onClose: () => void;
  onSaved: (variant: AdminProductVariant) => void;
}) {
  return (
    <Dialog
      open={variant !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {variant && (
        <EditVariantForm
          key={variant.id}
          variant={variant}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Dialog>
  );
}

/** Keyed by variant id, so state initialises straight from props. */
function EditVariantForm({
  variant,
  onClose,
  onSaved,
}: {
  variant: AdminProductVariant;
  onClose: () => void;
  onSaved: (variant: AdminProductVariant) => void;
}) {
  const { api } = useCatalogSurface();
  const [values, setValues] = React.useState(() => ({
    sku: variant.sku,
    price: variant.price,
    comparePrice: variant.comparePrice ?? "",
    stock: String(variant.stock),
    lowStockThreshold: String(variant.lowStockThreshold),
  }));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = (key: keyof typeof values) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => setValues((v) => ({ ...v, [key]: e.target.value }));

  async function save() {
    const price = Number(values.price);
    const stock = Number(values.stock);
    const threshold = Number(values.lowStockThreshold);
    const compare = values.comparePrice.trim();
    if (!Number.isFinite(price) || price <= 0) {
      setError("Price must be a positive number");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock must be a whole number");
      return;
    }
    if (!Number.isInteger(threshold) || threshold < 0) {
      setError("Low-stock threshold must be a whole number");
      return;
    }
    if (compare && (!Number.isFinite(Number(compare)) || Number(compare) <= 0)) {
      setError("Compare price must be a positive number");
      return;
    }
    const payload: VariantPayload = {
      sku: values.sku.trim(),
      price,
      comparePrice: compare ? Number(compare) : null,
      stock,
      lowStockThreshold: threshold,
    };
    setBusy(true);
    setError(null);
    try {
      onSaved(await api.updateVariant(variant.id, payload));
      onClose();
    } catch (err) {
      setError(messageOf(err, "Could not save the variant."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogContent>
      <DialogTitle>Edit {variant.name}</DialogTitle>
        {error && <FormAlert>{error}</FormAlert>}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="var-sku" className="text-sm font-medium">
              SKU
            </label>
            <Input id="var-sku" value={values.sku} onChange={set("sku")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="var-price" className="text-sm font-medium">
                Price (৳)
              </label>
              <Input
                id="var-price"
                type="number"
                min="1"
                value={values.price}
                onChange={set("price")}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="var-compare" className="text-sm font-medium">
                Compare price
              </label>
              <Input
                id="var-compare"
                type="number"
                min="1"
                placeholder="—"
                value={values.comparePrice}
                onChange={set("comparePrice")}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="var-stock" className="text-sm font-medium">
                Stock
              </label>
              <Input
                id="var-stock"
                type="number"
                min="0"
                value={values.stock}
                onChange={set("stock")}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="var-threshold" className="text-sm font-medium">
                Low-stock at
              </label>
              <Input
                id="var-threshold"
                type="number"
                min="0"
                value={values.lowStockThreshold}
                onChange={set("lowStockThreshold")}
              />
            </div>
          </div>
        </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={busy} />}>
          Cancel
        </DialogClose>
        <Button disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

/**
 * Options + variants, live. Options can only change while no variants exist
 * (the backend 409s otherwise); the star sets the default variant; every
 * cell edit goes through PATCH /admin/catalog/variants/:id.
 */
export function VariantsSection({
  productId,
  options,
  variants,
  onOptionsChange,
  onVariantsChange,
}: {
  productId: string;
  options: AdminProductOption[];
  variants: AdminProductVariant[];
  onOptionsChange: (options: AdminProductOption[]) => void;
  onVariantsChange: (variants: AdminProductVariant[]) => void;
}) {
  const { api } = useCatalogSurface();
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<AdminProductVariant | null>(
    null,
  );
  const [toDelete, setToDelete] = React.useState<AdminProductVariant | null>(
    null,
  );
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const replace = (next: AdminProductVariant) =>
    onVariantsChange(
      variants.map((v) => {
        if (v.id !== next.id) {
          return next.isDefault ? { ...v, isDefault: false } : v;
        }
        return next;
      }),
    );

  async function toggleActive(variant: AdminProductVariant, active: boolean) {
    setBusyId(variant.id);
    setError(null);
    try {
      replace(await api.updateVariant(variant.id, { isActive: active }));
    } catch (err) {
      setError(messageOf(err, "Could not update the variant."));
    } finally {
      setBusyId(null);
    }
  }

  async function makeDefault(variant: AdminProductVariant) {
    if (variant.isDefault) return;
    setBusyId(variant.id);
    setError(null);
    try {
      replace(await api.updateVariant(variant.id, { isDefault: true }));
    } catch (err) {
      setError(messageOf(err, "Could not set the default variant."));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusyId(toDelete.id);
    setError(null);
    try {
      await api.deleteVariant(toDelete.id);
      onVariantsChange(variants.filter((v) => v.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      setError(messageOf(err, "Could not delete the variant."));
      setToDelete(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variants</CardTitle>
        <CardDescription>
          {options.length > 0
            ? "Combinations of the options below. Prices in ৳."
            : "Attach options (e.g. Color, Size) to generate variants."}
        </CardDescription>
        {options.length > 0 && (
          <CardAction>
            <GenerateDialog
              productId={productId}
              options={options}
              onGenerated={onVariantsChange}
            />
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <FormAlert>{error}</FormAlert>}

        {variants.length === 0 ? (
          <AttachOptions
            productId={productId}
            attached={options}
            onOptionsChange={onOptionsChange}
          />
        ) : (
          options.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="font-medium">{option.name}:</span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {option.values.map((value) => (
                      <Badge
                        key={value.id}
                        variant="outline"
                        className="gap-1"
                      >
                        {value.hexColor && (
                          <span
                            aria-hidden
                            className="size-2.5 rounded-full border border-foreground/20"
                            style={{ backgroundColor: value.hexColor }}
                          />
                        )}
                        {value.value}
                      </Badge>
                    ))}
                  </span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Delete every variant to change the option set.
              </p>
            </div>
          )
        )}

        {variants.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Compare</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow
                  key={variant.id}
                  className={cn(!variant.isActive && "opacity-60")}
                >
                  <TableCell>
                    <span className="flex items-center gap-1.5 font-medium">
                      <button
                        type="button"
                        disabled={busyId === variant.id}
                        aria-label={
                          variant.isDefault
                            ? `${variant.name} is the default variant`
                            : `Make ${variant.name} the default variant`
                        }
                        aria-pressed={variant.isDefault}
                        onClick={() => void makeDefault(variant)}
                        className="text-muted-foreground/50 transition-colors hover:text-brand aria-pressed:text-brand"
                      >
                        <StarIcon
                          className={cn(
                            "size-3.5",
                            variant.isDefault && "fill-brand text-brand",
                          )}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(variant)}
                        className="hover:underline"
                      >
                        {variant.name}
                      </button>
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {variant.sku}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(Number(variant.price))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {variant.comparePrice
                      ? formatPrice(Number(variant.comparePrice))
                      : "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right tabular-nums",
                      variant.stock === 0 && "font-medium text-destructive",
                      variant.stock > 0 &&
                        variant.stock <= variant.lowStockThreshold &&
                        "font-medium text-amber-700 dark:text-amber-400",
                    )}
                  >
                    {variant.stock}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      aria-label={`${variant.name} active`}
                      disabled={busyId === variant.id}
                      checked={variant.isActive}
                      onCheckedChange={(checked) =>
                        void toggleActive(variant, checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${variant.name}`}
                      disabled={busyId === variant.id}
                      onClick={() => setToDelete(variant)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {variants.length === 0 && options.length > 0 && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <PlusIcon className="size-4" />
            No variants yet — use Generate to build the matrix.
          </p>
        )}
      </CardContent>

      <EditVariantDialog
        variant={editing}
        onClose={() => setEditing(null)}
        onSaved={replace}
      />

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete variant?</AlertDialogTitle>
          <AlertDialogDescription>
            “{toDelete?.name}” ({toDelete?.sku}) will be removed permanently.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>
              Cancel
            </AlertDialogClose>
            <Button variant="destructive" onClick={() => void confirmDelete()}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
