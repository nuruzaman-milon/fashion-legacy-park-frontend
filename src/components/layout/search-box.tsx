"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Autocomplete } from "@base-ui/react/autocomplete";
import { ArrowRightIcon, SearchIcon } from "lucide-react";

import { ProductThumb } from "@/components/product/product-thumb";
import { formatPrice } from "@/lib/format";
import type { ProductListItem } from "@/types/catalog";

const SEE_ALL = "see-all" as const;
type Suggestion = ProductListItem | typeof SEE_ALL;

/**
 * Header typeahead: suggestions appear while typing (debounced fetch to
 * /api/search); a suggestion navigates to its product page, plain Enter or
 * the magnifier submits to the full /search results page.
 */
export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [results, setResults] = React.useState<ProductListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [status, setStatus] = React.useState<"idle" | "loading" | "done">(
    "idle"
  );
  const timerRef = React.useRef<number | undefined>(undefined);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      abortRef.current?.abort();
    },
    []
  );

  const trimmed = query.trim();
  const searchHref = trimmed
    ? `/search?q=${encodeURIComponent(trimmed)}`
    : "/search";

  // The see-all row must be part of `items` too — Base UI derives each
  // item's highlight index from this array, and an unregistered item
  // shadows index 0's highlighted state.
  const suggestions = React.useMemo<Suggestion[]>(
    () => (results.length > 0 ? [...results, SEE_ALL] : []),
    [results]
  );

  const handleValueChange = (
    value: string,
    details: Autocomplete.Root.ChangeEventDetails
  ) => {
    setQuery(value);
    // An item press fills the input with the product title while we're
    // already navigating — no point refetching suggestions for it.
    if (details.reason === "item-press") return;

    window.clearTimeout(timerRef.current);
    abortRef.current?.abort();
    const q = value.trim();
    if (!q) {
      setResults([]);
      setTotal(0);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    timerRef.current = window.setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data: { products: ProductListItem[]; total: number } =
          await res.json();
        setResults(data.products);
        setTotal(data.total);
        setStatus("done");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setResults([]);
        setTotal(0);
        setStatus("done");
      }
    }, 200);
  };

  return (
    <form
      action="/search"
      onSubmit={(event) => {
        event.preventDefault();
        setOpen(false);
        router.push(searchHref);
      }}
      className="relative"
    >
      <Autocomplete.Root
        name="q"
        mode="none"
        items={suggestions}
        value={query}
        onValueChange={handleValueChange}
        open={open && trimmed.length > 0}
        onOpenChange={setOpen}
        itemToStringValue={(item: Suggestion) =>
          item === SEE_ALL ? query : item.title
        }
      >
        <button
          type="submit"
          aria-label="Search"
          className="absolute top-1/2 left-3 z-10 -translate-y-1/2 text-muted-foreground transition-colors hover:text-brand"
        >
          <SearchIcon className="size-4" />
        </button>
        <Autocomplete.Input
          aria-label="Search products"
          autoComplete="off"
          placeholder="Search for kurti, panjabi, saree…"
          className="h-8 w-64 rounded-full border border-[oklch(0.85_0.05_80)] bg-muted py-1 pr-2.5 pl-9 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        />

        <Autocomplete.Portal>
          <Autocomplete.Positioner
            sideOffset={8}
            align="end"
            className="z-50 select-none"
          >
            <Autocomplete.Popup className="scrollbar-subtle max-h-[min(24rem,var(--available-height))] w-80 min-w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-x-hidden overflow-y-auto rounded-xl border border-[oklch(0.88_0.04_82/0.8)] bg-popover bg-clip-padding p-1 text-popover-foreground shadow-xl shadow-[oklch(0.3_0.03_55/0.12)] transition-[opacity,transform] duration-150 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
              <Autocomplete.List>
                {results.map((product) => (
                  <SuggestionItem
                    key={product.id}
                    product={product}
                    onNavigate={() => setOpen(false)}
                  />
                ))}

                {results.length > 0 && (
                  <>
                    <div className="mx-1 my-1 h-px bg-border" />
                    <Autocomplete.Item
                      value={SEE_ALL}
                      render={<Link href={searchHref} />}
                      onClick={() => setOpen(false)}
                      className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-brand outline-none select-none data-highlighted:bg-primary data-highlighted:text-primary-foreground"
                    >
                      See all {total} {total === 1 ? "result" : "results"}
                      <ArrowRightIcon className="size-3.5" />
                    </Autocomplete.Item>
                  </>
                )}
              </Autocomplete.List>

              <Autocomplete.Empty className="text-center text-xs text-muted-foreground not-empty:px-3 not-empty:py-6">
                {status === "loading"
                  ? "Searching…"
                  : trimmed
                    ? "No matches — press Enter to search everything"
                    : null}
              </Autocomplete.Empty>
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
    </form>
  );
}

function SuggestionItem({
  product,
  onNavigate,
}: {
  product: ProductListItem;
  /** Fires on pointer click and on Enter while highlighted — closes the popup. */
  onNavigate: () => void;
}) {
  const sale = product.flashSale;
  const price = sale ? sale.flashPrice : product.minPrice;
  const compareAt = sale ? product.minPrice : product.comparePrice;
  const hasDiscount = compareAt !== null && compareAt > price;

  return (
    <Autocomplete.Item
      value={product}
      render={<Link href={`/products/${product.slug}`} />}
      onClick={onNavigate}
      className="group/item grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg p-1.5 pr-2.5 outline-none select-none data-highlighted:bg-primary data-highlighted:text-primary-foreground"
    >
      <ProductThumb
        title={product.title}
        image={product.image}
        seed={product.slug}
        sizes="40px"
        className="aspect-3/4 w-10 shrink-0 rounded-md"
      />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">
          {product.title}
        </span>
        <span className="block truncate text-xs text-muted-foreground group-data-[highlighted]/item:text-primary-foreground/75">
          {product.category.name}
        </span>
      </span>
      <span className="text-right">
        <span className="block text-sm font-semibold">
          {formatPrice(price)}
        </span>
        {hasDiscount && (
          <span className="block text-xs text-muted-foreground line-through group-data-[highlighted]/item:text-primary-foreground/70">
            {formatPrice(compareAt)}
          </span>
        )}
      </span>
    </Autocomplete.Item>
  );
}
