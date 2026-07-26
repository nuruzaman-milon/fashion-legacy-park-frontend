"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  HeartIcon,
  ShoppingBagIcon,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/product/rating-stars";
import { ProductThumb } from "@/components/product/product-thumb";
import { discountPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WishlistItem } from "@/lib/api/wishlist";

const ADDED_FEEDBACK_MS = 2000;

function StockLine({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
        <span className="size-1.5 rounded-full bg-destructive" />
        Out of stock
      </span>
    );
  }
  if (stock <= 5) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-brand">
        <span className="size-1.5 rounded-full bg-brand" />
        Only {stock} left
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-1.5 rounded-full bg-[oklch(0.62_0.14_150)]" />
      In stock
    </span>
  );
}

export function WishlistView({ initialItems }: { initialItems: WishlistItem[] }) {
  const [items, setItems] = React.useState(initialItems);
  const [addedIds, setAddedIds] = React.useState<Set<string>>(new Set());
  const timers = React.useRef<Map<string, number>>(new Map());

  React.useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const removeItem = (id: string) =>
    setItems((current) => current.filter((item) => item.id !== id));

  const markAdded = (ids: string[]) => {
    setAddedIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => next.add(id));
      return next;
    });
    ids.forEach((id) => {
      window.clearTimeout(timers.current.get(id));
      timers.current.set(
        id,
        window.setTimeout(() => {
          setAddedIds((current) => {
            const next = new Set(current);
            next.delete(id);
            return next;
          });
        }, ADDED_FEEDBACK_MS)
      );
    });
  };

  const inStock = items.filter((item) => item.stock > 0);
  const totalWorth = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">
            Wishlist
          </p>
          <h1 className="font-heading mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
            Your Wishlist
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {items.length} saved {items.length === 1 ? "item" : "items"}
            {items.length > 0 && <> · worth {formatPrice(totalWorth)}</>}
          </p>
        </div>
        {inStock.length > 1 && (
          <Button
            variant="outline"
            className="h-9"
            onClick={() => markAdded(inStock.map((item) => item.id))}
          >
            <ShoppingBagIcon />
            Add all to cart
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed px-6 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent/70">
            <HeartIcon className="size-6 text-brand" />
          </span>
          <p className="font-heading mt-4 text-xl font-medium">
            Your wishlist is empty
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Tap the heart on any product to keep it here for later — your picks
            stay saved across devices.
          </p>
          <Button className="mt-6" render={<Link href="/products" />}>
            Discover styles
            <ArrowRightIcon />
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-8 overflow-hidden rounded-2xl border bg-card">
            <ul className="divide-y">
              {items.map((item) => {
                const outOfStock = item.stock === 0;
                const hasDiscount =
                  item.comparePrice !== null && item.comparePrice > item.price;
                const added = addedIds.has(item.id);

                return (
                  <li
                    key={item.id}
                    className="flex gap-4 p-4 transition-colors hover:bg-muted/40 sm:gap-5 sm:p-5"
                  >
                    <Link
                      href={`/products/${item.slug}`}
                      className="shrink-0"
                      tabIndex={-1}
                    >
                      <ProductThumb
                        title={item.title}
                        image={item.image}
                        seed={item.slug}
                        sizes="96px"
                        className={cn(
                          "aspect-3/4 w-20 rounded-xl sm:w-24",
                          outOfStock && "opacity-55 grayscale-25"
                        )}
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                          {item.categoryName}
                        </p>
                        <h3 className="mt-0.5 line-clamp-2 text-sm font-medium sm:text-base">
                          <Link
                            href={`/products/${item.slug}`}
                            className="transition-colors hover:text-brand"
                          >
                            {item.title}
                          </Link>
                        </h3>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                          <RatingStars
                            rating={item.avgRating}
                            reviewCount={item.reviewCount}
                          />
                          <StockLine stock={item.stock} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:w-40 sm:flex-col sm:items-end sm:justify-center sm:gap-1.5">
                        <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0.5">
                          <span className="text-base font-semibold">
                            {formatPrice(item.price)}
                          </span>
                          {hasDiscount && (
                            <span className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground line-through">
                                {formatPrice(item.comparePrice!)}
                              </span>
                              <Badge className="bg-brand/10 px-1.5 text-[10px] text-brand">
                                −{discountPercent(item.price, item.comparePrice!)}%
                              </Badge>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:shrink-0">
                        <Button
                          className={cn(
                            "h-9 flex-1 sm:w-40 sm:flex-none",
                            added && "bg-brand text-brand-foreground hover:bg-brand"
                          )}
                          disabled={outOfStock}
                          onClick={() => markAdded([item.id])}
                        >
                          {outOfStock ? (
                            "Out of Stock"
                          ) : added ? (
                            <>
                              <CheckIcon />
                              Added to Cart
                            </>
                          ) : (
                            <>
                              <ShoppingBagIcon />
                              Add to Cart
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${item.title} from wishlist`}
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              <ArrowLeftIcon className="size-4" />
              Continue shopping
            </Link>
            <p className="text-xs text-muted-foreground">
              Saved items stay in your wishlist across devices
            </p>
          </div>
        </>
      )}
    </div>
  );
}
