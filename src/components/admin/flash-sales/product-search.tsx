"use client";

import * as React from "react";
import Image from "next/image";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { listAdminProducts } from "@/lib/api/admin/products";
import { formatPriceRange } from "@/lib/format";
import type { AdminProductListItem } from "@/types/admin";

/**
 * Debounced product finder for the rule/item dialogs: type ≥ 2 characters,
 * click a result. The result set carries its query so a stale response for
 * an earlier string never renders (derived-loading pattern).
 */
export function ProductSearch({
  onPick,
}: {
  onPick: (product: AdminProductListItem) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [result, setResult] = React.useState<{
    query: string;
    items: AdminProductListItem[];
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => {
      listAdminProducts({ search: q, limit: 8 })
        .then(({ items }) => setResult({ query: q, items }))
        .catch(() => setError("Search failed — please try again."));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const q = query.trim();
  const items = result?.query === q ? result.items : null;

  return (
    <div className="space-y-2">
      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search products"
          placeholder="Search products by name…"
          className="h-10 pl-9"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(null);
          }}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {q.length >= 2 && items?.length === 0 && (
        <p className="px-1 text-sm text-muted-foreground">
          Nothing matches “{q}”.
        </p>
      )}
      {items && items.length > 0 && (
        <ul className="max-h-64 overflow-y-auto rounded-lg border border-border">
          {items.map((product) => {
            const image = product.images.find((i) => i.isPrimary) ??
              product.images[0];
            return (
              <li key={product.id} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  onClick={() => onPick(product)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent/50"
                >
                  {image ? (
                    <Image
                      src={image.url}
                      alt=""
                      width={36}
                      height={44}
                      className="h-11 w-9 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="flex h-11 w-9 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                      {product.name[0]}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {product.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {product.category.name} ·{" "}
                      {product._count.variants}{" "}
                      {product._count.variants === 1 ? "variant" : "variants"}
                      {product.status !== "ACTIVE" && (
                        <> · {product.status.toLowerCase().replace("_", " ")}</>
                      )}
                    </span>
                  </span>
                  {product.minPrice !== null && product.maxPrice !== null && (
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatPriceRange(
                        Number(product.minPrice),
                        Number(product.maxPrice),
                      )}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
