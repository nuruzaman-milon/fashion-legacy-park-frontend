import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product/product-card";
import { getCategories, searchProducts } from "@/lib/api/products";

const POPULAR_SEARCHES = [
  "Dress",
  "Sneakers",
  "Blazer",
  "Shirt",
  "Makeup",
  "Heels",
  "Tee",
  "Skincare",
];

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const q = first((await searchParams).q)?.trim();
  return {
    title: q ? `Search: “${q}”` : "Search",
    description:
      "Search the full Fashion Legacy catalogue — clothing, footwear, accessories and cosmetics, delivered across Bangladesh.",
  };
}

function SearchChips({ heading, items }: { heading: string; items: { label: string; href: string; count?: number }[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold tracking-[0.08em] text-brand uppercase">
        {heading}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="inline-flex items-center gap-1.5 rounded-full border border-[oklch(0.85_0.06_80/0.7)] bg-accent/60 px-3.5 py-1.5 text-sm text-foreground/85 transition-colors hover:bg-accent"
          >
            {item.label}
            {item.count !== undefined && (
              <span className="text-xs text-muted-foreground">{item.count}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = (first((await searchParams).q) ?? "").trim();
  const { products, total } = q
    ? await searchProducts(q)
    : { products: [], total: 0 };
  const categories = q ? [] : await getCategories();

  const popularChips = POPULAR_SEARCHES.map((label) => ({
    label,
    href: `/search?q=${encodeURIComponent(label.toLowerCase())}`,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">
        Search
      </p>
      <h1 className="font-heading mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
        {q ? (
          <>
            Results for <span className="text-brand">“{q}”</span>
          </>
        ) : (
          "What are you looking for?"
        )}
      </h1>
      {q && (
        <p className="mt-1.5 text-sm text-muted-foreground">
          {total} {total === 1 ? "style" : "styles"} found
        </p>
      )}

      <form action="/search" className="relative mt-6 max-w-2xl">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          key={q}
          type="search"
          name="q"
          defaultValue={q}
          autoFocus={!q}
          placeholder="Search for dresses, sneakers, makeup…"
          aria-label="Search products"
          className="h-12 rounded-full border-[oklch(0.85_0.05_80)] bg-background pr-28 pl-11 text-base"
        />
        <Button
          type="submit"
          className="absolute top-1/2 right-1.5 h-9 -translate-y-1/2 rounded-full px-5"
        >
          Search
        </Button>
      </form>

      {!q ? (
        <div className="mt-10 space-y-8">
          <SearchChips heading="Popular right now" items={popularChips} />
          <SearchChips
            heading="Browse categories"
            items={categories.map((c) => ({
              label: c.name,
              href: `/products?category=${c.slug}`,
              count: c.productCount,
            }))}
          />
        </div>
      ) : products.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent/70">
            <SearchIcon className="size-6 text-brand" />
          </span>
          <p className="font-heading mt-4 text-xl font-medium">
            Nothing matched “{q}”
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Check the spelling, try a shorter word, or explore one of these
            popular picks instead.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {popularChips.slice(0, 6).map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                className="rounded-full border border-[oklch(0.85_0.06_80/0.7)] bg-accent/60 px-3.5 py-1.5 text-sm text-foreground/85 transition-colors hover:bg-accent"
              >
                {chip.label}
              </Link>
            ))}
          </div>
          <Link
            href="/products"
            className="mt-6 text-sm font-medium text-brand hover:underline"
          >
            Browse all products
          </Link>
        </div>
      )}
    </div>
  );
}
