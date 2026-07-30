"use client";

import * as React from "react";
import { PlusIcon, StarIcon, WandSparklesIcon } from "lucide-react";

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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/format";
import type { AdminProductOption, AdminProductVariant } from "@/types/admin";
import { cn } from "@/lib/utils";

/**
 * Options + variants of the edit page. Toggles mutate local state only —
 * the live version maps them to PATCH /admin/catalog/variants/:id.
 */
export function VariantsSection({
  options,
  variants: initialVariants,
}: {
  options: AdminProductOption[];
  variants: AdminProductVariant[];
}) {
  const [variants, setVariants] = React.useState(initialVariants);

  const patch = (id: string, delta: Partial<AdminProductVariant>) =>
    setVariants((prev) =>
      prev.map((v) => {
        if (v.id !== id) return delta.isDefault ? { ...v, isDefault: false } : v;
        return { ...v, ...delta };
      }),
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Variants</CardTitle>
        <CardDescription>
          {options.length > 0
            ? "Combinations of the options below. Prices in ৳."
            : "Attach options (e.g. Color, Size) to generate variants."}
        </CardDescription>
        <CardAction className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled>
            <WandSparklesIcon className="size-3.5" />
            Generate
          </Button>
          <Button type="button" variant="outline" size="sm" disabled>
            <PlusIcon className="size-3.5" />
            Add variant
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {options.map((option) => (
              <div key={option.id} className="flex items-center gap-2 text-sm">
                <span className="font-medium">{option.name}:</span>
                <span className="flex flex-wrap items-center gap-1.5">
                  {option.values.map((value) => (
                    <Badge key={value.id} variant="outline" className="gap-1">
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
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Variant</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Compare</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-center">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No variants yet — generate them from the options.
                </TableCell>
              </TableRow>
            )}
            {variants.map((variant) => (
              <TableRow
                key={variant.id}
                className={cn(!variant.isActive && "opacity-60")}
              >
                <TableCell>
                  <span className="flex items-center gap-1.5 font-medium">
                    <button
                      type="button"
                      aria-label={
                        variant.isDefault
                          ? `${variant.name} is the default variant`
                          : `Make ${variant.name} the default variant`
                      }
                      aria-pressed={variant.isDefault}
                      onClick={() => patch(variant.id, { isDefault: true })}
                      className="text-muted-foreground/50 transition-colors hover:text-brand aria-pressed:text-brand"
                    >
                      <StarIcon
                        className={cn(
                          "size-3.5",
                          variant.isDefault && "fill-brand text-brand",
                        )}
                      />
                    </button>
                    {variant.name}
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
                    checked={variant.isActive}
                    onCheckedChange={(checked) =>
                      patch(variant.id, { isActive: checked })
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground">
          Design preview — add, generate and inline edits activate with the API
          wiring.
        </p>
      </CardContent>
    </Card>
  );
}
