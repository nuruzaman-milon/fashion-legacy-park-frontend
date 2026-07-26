"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  HeartIcon,
  ShoppingBagIcon,
  XIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/product/rating-stars";
import { ProductThumb } from "@/components/product/product-thumb";
import { discountPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WishlistItem } from "@/lib/api/wishlist";

const ADDED_FEEDBACK_MS = 2000;

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

  const addToCart = (id: string) => {
    setAddedIds((current) => new Set(current).add(id));
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
  };

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">
        Wishlist
      </p>
      <h1 className="font-heading mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
        Your Wishlist
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {items.length} saved {items.length === 1 ? "item" : "items"}
      </p>

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
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const outOfStock = item.stock === 0;
            const lowStock = !outOfStock && item.stock <= 5;
            const hasDiscount =
              item.comparePrice !== null && item.comparePrice > item.price;
            const added = addedIds.has(item.id);

            return (
              <article
                key={item.id}
                className="group relative isolate flex flex-col"
              >
                <div className="relative">
                  <Link href={`/products/${item.slug}`} tabIndex={-1}>
                    <ProductThumb
                      title={item.title}
                      image={item.image}
                      seed={item.slug}
                      className={cn(
                        "aspect-3/4 rounded-xl transition-transform duration-300 group-hover:scale-[1.02]",
                        outOfStock && "opacity-60 grayscale-25"
                      )}
                    />
                  </Link>
                  <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
                    {outOfStock ? (
                      <Badge variant="secondary">Out of stock</Badge>
                    ) : (
                      hasDiscount && (
                        <Badge className="bg-brand text-brand-foreground">
                          −{discountPercent(item.price, item.comparePrice!)}%
                        </Badge>
                      )
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${item.title} from wishlist`}
                    onClick={() => removeItem(item.id)}
                    className="absolute top-2.5 right-2.5 z-10 flex size-8 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-destructive hover:text-white"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-1 flex-col gap-1">
                  <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    {item.categoryName}
                  </p>
                  <h3 className="line-clamp-2 text-sm font-medium text-foreground">
                    <Link
                      href={`/products/${item.slug}`}
                      className="transition-colors hover:text-brand"
                    >
                      {item.title}
                    </Link>
                  </h3>
                  <RatingStars
                    rating={item.avgRating}
                    reviewCount={item.reviewCount}
                  />
                  <p className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {formatPrice(item.price)}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(item.comparePrice!)}
                      </span>
                    )}
                  </p>
                  {lowStock && (
                    <p className="text-xs font-medium text-brand">
                      Only {item.stock} left
                    </p>
                  )}
                </div>

                <Button
                  className={cn(
                    "mt-3 w-full",
                    added &&
                      "bg-brand text-brand-foreground hover:bg-brand"
                  )}
                  disabled={outOfStock}
                  onClick={() => addToCart(item.id)}
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
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
