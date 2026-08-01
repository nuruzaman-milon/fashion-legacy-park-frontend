"use client";

import * as React from "react";

import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryRulesSection } from "@/components/admin/flash-sales/category-rules-section";
import { FlashSaleForm } from "@/components/admin/flash-sales/flash-sale-form";
import { phaseOf } from "@/components/admin/flash-sales/phase";
import { SaleProductsSection } from "@/components/admin/flash-sales/sale-products-section";
import { getAdminCategories } from "@/lib/api/admin/categories";
import {
  getAdminFlashSale,
  type AdminFlashSaleDetail,
} from "@/lib/api/admin/flash-sales";
import { ApiError } from "@/lib/api/client";
import type { AdminCategory } from "@/types/admin";

/**
 * Details, products and category discounts of one sale — each section saves
 * on its own. `autoAdd` opens the add-products dialog straight away (the
 * create page redirects here with it, so step two starts itself).
 */
export function FlashSaleEditor({
  saleId,
  autoAdd = false,
}: {
  saleId: string;
  autoAdd?: boolean;
}) {
  const [sale, setSale] = React.useState<AdminFlashSaleDetail | null>(null);
  // Ancestor chains for the price preview + the category picker labels.
  const [categories, setCategories] = React.useState<AdminCategory[] | null>(
    null,
  );
  // Captured at load — a stable "now" for the live check (the purity lint
  // bars Date.now() during render).
  const [now, setNow] = React.useState(0);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    return getAdminFlashSale(saleId)
      .then((detail) => {
        setSale(detail);
        setNow(Date.now());
      })
      .catch((err) => {
        setLoadError(
          err instanceof ApiError && err.status === 404
            ? "This flash sale no longer exists."
            : err instanceof ApiError
              ? err.message
              : "Could not load the flash sale. Please try again.",
        );
      });
  }, [saleId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    getAdminCategories().then(setCategories).catch(() => {
      // Price previews fall back to "via category" less precisely; the
      // category dialog shows its own loading note.
    });
  }, []);

  if (loadError && sale === null) {
    return (
      <div className="space-y-3">
        <FormAlert>{loadError}</FormAlert>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoadError(null);
            void load();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (sale === null) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {phaseOf(sale, now) === "live" && (
        <p className="rounded-lg border border-amber-600/25 bg-amber-600/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          This sale is live right now — every change below reaches shoppers
          immediately.
        </p>
      )}
      <FlashSaleForm
        initial={sale}
        onSaved={(updated) =>
          setSale((prev) => (prev ? { ...prev, ...updated } : prev))
        }
      />
      <SaleProductsSection
        sale={sale}
        categories={categories}
        onChanged={load}
        autoAdd={autoAdd}
      />
      <CategoryRulesSection
        sale={sale}
        categories={categories}
        onChanged={load}
      />
    </div>
  );
}
