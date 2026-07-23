import Link from "next/link";
import { StarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CategorySummary } from "@/types/catalog";

/** Whitelisted `/products` query params — everything else is dropped. */
export interface ProductFilterParams {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  rating?: string;
  sale?: string;
  sort?: string;
}

const PARAM_KEYS = [
  "category",
  "minPrice",
  "maxPrice",
  "rating",
  "sale",
  "sort",
] as const;

/** Builds a `/products` URL from the current params plus a patch. */
export function productsHref(
  params: ProductFilterParams,
  patch: Partial<ProductFilterParams>
): string {
  const next = { ...params, ...patch };
  const qs = new URLSearchParams();
  for (const key of PARAM_KEYS) {
    const value = next[key];
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `/products?${s}` : "/products";
}

export function hasActiveFilters(params: ProductFilterParams): boolean {
  return Boolean(
    params.category ||
      params.minPrice ||
      params.maxPrice ||
      params.rating ||
      params.sale
  );
}

export const PRICE_PRESETS: {
  label: string;
  minPrice?: string;
  maxPrice?: string;
}[] = [
  { label: "Under ৳1,000", maxPrice: "1000" },
  { label: "৳1,000 – ৳3,000", minPrice: "1000", maxPrice: "3000" },
  { label: "৳3,000 – ৳6,000", minPrice: "3000", maxPrice: "6000" },
  { label: "Over ৳6,000", minPrice: "6000" },
];

function FilterRow({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
        active
          ? "bg-accent font-medium text-brand"
          : "text-foreground/75 hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="px-2.5 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {title}
      </p>
      <div className="mt-2 flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

export function ProductFilters({
  categories,
  params,
}: {
  categories: CategorySummary[];
  params: ProductFilterParams;
}) {
  const pricePresetActive = (preset: (typeof PRICE_PRESETS)[number]) =>
    (params.minPrice ?? "") === (preset.minPrice ?? "") &&
    (params.maxPrice ?? "") === (preset.maxPrice ?? "");

  return (
    <div className="flex flex-col gap-7">
      <FilterSection title="Category">
        <FilterRow
          href={productsHref(params, { category: undefined })}
          active={!params.category}
        >
          All products
        </FilterRow>
        {categories.map((category) => (
          <FilterRow
            key={category.id}
            href={productsHref(params, { category: category.slug })}
            active={params.category === category.slug}
          >
            {category.name}
            <span className="text-xs font-normal text-muted-foreground">
              {category.productCount}
            </span>
          </FilterRow>
        ))}
      </FilterSection>

      <FilterSection title="Price">
        <FilterRow
          href={productsHref(params, {
            minPrice: undefined,
            maxPrice: undefined,
          })}
          active={!params.minPrice && !params.maxPrice}
        >
          Any price
        </FilterRow>
        {PRICE_PRESETS.map((preset) => (
          <FilterRow
            key={preset.label}
            href={productsHref(params, {
              minPrice: preset.minPrice,
              maxPrice: preset.maxPrice,
            })}
            active={pricePresetActive(preset)}
          >
            {preset.label}
          </FilterRow>
        ))}
      </FilterSection>

      <FilterSection title="Rating">
        <FilterRow
          href={productsHref(params, { rating: undefined })}
          active={!params.rating}
        >
          Any rating
        </FilterRow>
        {["4", "3"].map((rating) => (
          <FilterRow
            key={rating}
            href={productsHref(params, { rating })}
            active={params.rating === rating}
          >
            <span className="inline-flex items-center gap-1.5">
              <StarIcon className="size-3.5 fill-current text-brand" />
              {rating} & up
            </span>
          </FilterRow>
        ))}
      </FilterSection>

      <FilterSection title="Offers">
        <FilterRow
          href={productsHref(params, {
            sale: params.sale === "1" ? undefined : "1",
          })}
          active={params.sale === "1"}
        >
          On sale
        </FilterRow>
      </FilterSection>

      {hasActiveFilters(params) && (
        <Link
          href={productsHref({ sort: params.sort }, {})}
          className="px-2.5 text-sm font-medium text-brand hover:underline"
        >
          Clear all filters
        </Link>
      )}
    </div>
  );
}
