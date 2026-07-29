"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  HeartIcon,
  ShoppingBagIcon,
  Trash2Icon,
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useShop } from "@/components/shop/shop-provider";
import { SignInPrompt } from "@/components/shared/auth-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingStars } from "@/components/product/rating-stars";
import { ProductThumb } from "@/components/product/product-thumb";
import { formatPrice } from "@/lib/format";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { WishlistItem } from "@/lib/api/wishlist";
import { cn } from "@/lib/utils";

const ADDED_FEEDBACK_MS = 2000;

/** Mirrors the wishlist rows while the list loads. */
function WishlistSkeleton() {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border bg-card">
      <div className="divide-y">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 sm:gap-5 sm:p-5">
            <Skeleton className="aspect-3/4 w-20 shrink-0 rounded-xl sm:w-24" />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="hidden flex-col items-end justify-center gap-2 sm:flex">
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-28 rounded-md sm:w-40" />
              <Skeleton className="size-9 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StockLine({ item }: { item: WishlistItem }) {
  if (!item.isPurchasable) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
        <span className="size-1.5 rounded-full bg-destructive" />
        No longer available
      </span>
    );
  }
  if (!item.isInStock) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
        <span className="size-1.5 rounded-full bg-destructive" />
        Out of stock
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

export function WishlistView() {
  const { status } = useAuth();
  const shop = useShop();
  const router = useRouter();
  const items = shop.wishlist;
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [addedIds, setAddedIds] = React.useState<Set<string>>(new Set());
  const timers = React.useRef<Map<string, number>>(new Map());

  React.useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  const showError = (error: unknown) =>
    setActionError(
      error instanceof ApiError
        ? error.message
        : "Something went wrong — please try again.",
    );

  const markAdded = (id: string) => {
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
      }, ADDED_FEEDBACK_MS),
    );
  };

  // Optimistic via the provider — the row disappears instantly and comes
  // back (with an error message) only if the backend refuses.
  const removeItem = (item: WishlistItem) => {
    setActionError(null);
    shop.removeWishlistItem(item.productId).catch(showError);
  };

  /**
   * The cart is variant-level and the wishlist product-level: a product with
   * one variant goes straight in (and stays hearted); with several, the
   * customer picks size or colour on the product page — guessing for them is
   * how wrong sizes ship.
   */
  const addToCart = async (item: WishlistItem) => {
    setPendingId(item.productId);
    setActionError(null);
    try {
      const { variants } = await apiFetch<{ variants: { id: string }[] }>(
        `/products/${encodeURIComponent(item.slug)}`,
      );
      if (variants.length === 1) {
        // Confirm instantly; the provider's badge already moved. A backend
        // refusal replaces the feedback with the error message.
        markAdded(item.productId);
        shop.addToCart(variants[0].id, 1).catch((error) => {
          setAddedIds((current) => {
            const next = new Set(current);
            next.delete(item.productId);
            return next;
          });
          showError(error);
        });
      } else {
        router.push(`/products/${item.slug}`);
      }
    } catch (error) {
      showError(error);
    } finally {
      setPendingId(null);
    }
  };

  const header = (
    <div>
      <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">
        Wishlist
      </p>
      <h1 className="font-heading mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
        Your Wishlist
      </h1>
    </div>
  );

  if (
    status === "loading" ||
    (status === "authenticated" && shop.wishlistState !== "error" && !items)
  ) {
    return (
      <div>
        {header}
        <Skeleton className="mt-2.5 h-4 w-28" />
        <WishlistSkeleton />
      </div>
    );
  }

  if (status === "anonymous") {
    return (
      <div>
        {header}
        <SignInPrompt
          icon={HeartIcon}
          title="Sign in to see your wishlist"
          copy="Tap the heart on any product to keep it here for later — your picks stay saved to your account, across devices."
          nextPath="/wishlist"
        />
      </div>
    );
  }

  if (!items) {
    return (
      <div>
        {header}
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed px-6 py-20 text-center">
          <p className="font-heading text-xl font-medium">
            Couldn’t load your wishlist
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Something went wrong on our side. Give it another try.
          </p>
          <Button className="mt-6" onClick={shop.reloadWishlist}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const totalWorth = items.reduce((sum, item) => sum + item.minPrice, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {header}
          <p className="mt-1.5 text-sm text-muted-foreground">
            {items.length} saved {items.length === 1 ? "item" : "items"}
            {items.length > 0 && <> · worth {formatPrice(totalWorth)}</>}
          </p>
        </div>
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
          {actionError && (
            <p
              role="alert"
              className="mt-6 rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            >
              {actionError}
            </p>
          )}

          <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
            <ul className="divide-y">
              {items.map((item) => {
                const unbuyable = !item.isPurchasable || !item.isInStock;
                const added = addedIds.has(item.productId);
                const busy = pendingId !== null;

                return (
                  <li
                    key={item.productId}
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
                          unbuyable && "opacity-55 grayscale-25"
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
                          <StockLine item={item} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:w-32 sm:flex-col sm:items-end sm:justify-center sm:gap-0.5">
                        <span className="text-base font-semibold">
                          {formatPrice(item.minPrice)}
                        </span>
                        {item.maxPrice > item.minPrice && (
                          <span className="text-xs text-muted-foreground">
                            up to {formatPrice(item.maxPrice)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 sm:shrink-0">
                        <Button
                          className={cn(
                            "h-9 flex-1 sm:w-40 sm:flex-none",
                            added && "bg-brand text-brand-foreground hover:bg-brand"
                          )}
                          disabled={unbuyable || busy}
                          onClick={() => addToCart(item)}
                        >
                          {unbuyable ? (
                            "Unavailable"
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
                          disabled={busy}
                          onClick={() => removeItem(item)}
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
