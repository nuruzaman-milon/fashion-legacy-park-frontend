import type { Metadata } from "next";
import Link from "next/link";
import { XIcon } from "lucide-react";

import { MobileFilters } from "@/components/product/mobile-filters";
import { ProductCard } from "@/components/product/product-card";
import {
  ProductFilters,
  hasActiveFilters,
  productsHref,
  type ProductFilterParams,
} from "@/components/product/product-filters";
import { SortSelect } from "@/components/product/sort-select";
import { ScrollArea } from "@/components/shared/scroll-area";
import { formatPrice } from "@/lib/format";
import {
  getCategories,
  getProducts,
  type ProductSort,
} from "@/lib/api/products";

export const metadata: Metadata = {
  title: "Shop all products",
  description:
    "Browse the full Fashion Legacy catalogue — clothing, footwear, accessories and cosmetics, delivered across Bangladesh.",
};

const SORT_VALUES: ProductSort[] = [
  "featured",
  "newest",
  "best-selling",
  "price-asc",
  "price-desc",
  "rating",
];

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const toNumber = (value: string | undefined) => {
  if (value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

function priceChipLabel(params: ProductFilterParams): string | null {
  const min = toNumber(params.minPrice);
  const max = toNumber(params.maxPrice);
  if (min !== undefined && max !== undefined)
    return `${formatPrice(min)} – ${formatPrice(max)}`;
  if (max !== undefined) return `Under ${formatPrice(max)}`;
  if (min !== undefined) return `Over ${formatPrice(min)}`;
  return null;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params: ProductFilterParams = {
    category: first(raw.category),
    minPrice: first(raw.minPrice),
    maxPrice: first(raw.maxPrice),
    rating: first(raw.rating),
    sale: first(raw.sale),
    sort: first(raw.sort),
  };
  const sort = SORT_VALUES.includes(params.sort as ProductSort)
    ? (params.sort as ProductSort)
    : undefined;

  const [{ products, total }, categories] = await Promise.all([
    getProducts({
      category: params.category,
      minPrice: toNumber(params.minPrice),
      maxPrice: toNumber(params.maxPrice),
      rating: toNumber(params.rating),
      onSale: params.sale === "1",
      sort,
    }),
    getCategories(),
  ]);

  const activeCategory = categories.find((c) => c.slug === params.category);

  const chips: { label: string; href: string }[] = [];
  if (activeCategory) {
    chips.push({
      label: activeCategory.name,
      href: productsHref(params, { category: undefined }),
    });
  }
  const priceLabel = priceChipLabel(params);
  if (priceLabel) {
    chips.push({
      label: priceLabel,
      href: productsHref(params, { minPrice: undefined, maxPrice: undefined }),
    });
  }
  if (params.rating) {
    chips.push({
      label: `${params.rating}★ & up`,
      href: productsHref(params, { rating: undefined }),
    });
  }
  if (params.sale === "1") {
    chips.push({
      label: "On sale",
      href: productsHref(params, { sale: undefined }),
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:h-[calc(100dvh-109px)] lg:overflow-hidden lg:py-0">
      {/* Lock page scroll on desktop — filters and products scroll independently.
          The footer is hidden so the document is exactly viewport-height: with
          zero scrollable overflow the browser clamps any leftover scroll offset
          (e.g. arriving from a scrolled homepage, or Next's scroll-into-view
          landing below the sticky header) back to 0, so nothing gets cut off. */}
      <style>{`@media (min-width: 64rem) {
        body { overflow: hidden; }
        body > footer { display: none; }
      }`}</style>

      <div className="flex gap-10 lg:h-full lg:min-h-0">
        <ScrollArea
          as="aside"
          className="hidden w-60 shrink-0 lg:block lg:overflow-y-auto lg:overscroll-contain lg:pt-8 lg:pr-2 lg:pb-8"
        >
          <ProductFilters categories={categories} params={params} />
        </ScrollArea>

        <ScrollArea className="min-w-0 flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:pb-8">
          <div className="lg:pt-8 lg:pb-3">
            <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">
              Shop
            </p>
            <h1 className="font-heading mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
              {activeCategory ? activeCategory.name : "All Products"}
            </h1>
          </div>

          {chips.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 lg:mt-0 lg:pb-2">
              {chips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.85_0.06_80/0.7)] bg-accent/60 py-1 pr-2.5 pl-3.5 text-sm text-foreground/85 transition-colors hover:bg-accent"
                >
                  {chip.label}
                  <XIcon className="size-3.5 text-muted-foreground" />
                </Link>
              ))}
              <Link
                href={productsHref({ sort: params.sort }, {})}
                className="px-1.5 text-sm font-medium text-brand hover:underline"
              >
                Clear all
              </Link>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 lg:sticky lg:top-0 lg:z-10 lg:mt-0 lg:border-b lg:bg-background lg:py-3">
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? "style" : "styles"}
            </p>
            <div className="flex items-center gap-2.5">
              <MobileFilters>
                <ProductFilters categories={categories} params={params} />
              </MobileFilters>
              <SortSelect />
            </div>
          </div>

          {products.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed px-6 py-16 text-center">
              <p className="font-heading text-xl font-medium">
                No styles match these filters
              </p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Try widening the price range or clearing a filter — new pieces
                land every week.
              </p>
              {hasActiveFilters(params) && (
                <Link
                  href={productsHref({ sort: params.sort }, {})}
                  className="mt-5 text-sm font-medium text-brand hover:underline"
                >
                  Clear all filters
                </Link>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
