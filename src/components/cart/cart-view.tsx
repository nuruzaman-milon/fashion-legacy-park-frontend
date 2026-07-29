"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  HandCoinsIcon,
  HeartIcon,
  MinusIcon,
  PlusIcon,
  RefreshCcwIcon,
  ShoppingBagIcon,
  TrendingDownIcon,
  TruckIcon,
  XIcon,
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useShop } from "@/components/shop/shop-provider";
import { SignInPrompt } from "@/components/shared/auth-panel";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductThumb } from "@/components/product/product-thumb";
import { formatPrice } from "@/lib/format";
import { UNAVAILABLE_REASON_LABEL } from "@/lib/api/cart";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const FREE_DELIVERY_MIN = 2000;
const DELIVERY_FEE = 80;

/** Mirrors the cart's lines + summary layout while the cart loads. */
function CartSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-10 lg:flex-row lg:gap-12">
      <div className="min-w-0 flex-1 divide-y">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-5 sm:gap-5">
            <Skeleton className="aspect-3/4 w-20 shrink-0 rounded-xl sm:w-24" />
            <div className="flex min-w-0 flex-1 flex-col">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-2 h-3 w-24" />
              <div className="mt-auto flex items-end justify-between pt-3">
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="w-full shrink-0 lg:w-96">
        <div className="rounded-2xl border bg-card p-6">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-4 h-14 w-full rounded-xl" />
          <div className="mt-6 space-y-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="mt-6 h-11 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function CartView() {
  const { status } = useAuth();
  const shop = useShop();
  const cart = shop.cart;
  /** Line id (or "cart") with a mutation in flight — controls disable. */
  const [pending, setPending] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  /**
   * Provider mutations are optimistic — the UI already moved when these
   * resolve; this wrapper only surfaces rollbacks as an error message and
   * briefly guards against overlapping edits of the same cart.
   */
  const mutate = async (key: string, action: () => Promise<void>) => {
    setPending(key);
    setActionError(null);
    try {
      await action();
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong — please try again.",
      );
    } finally {
      setPending(null);
    }
  };

  const header = (
    <>
      <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">
        Cart
      </p>
      <h1 className="font-heading mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
        Shopping Cart
      </h1>
    </>
  );

  if (
    status === "loading" ||
    (status === "authenticated" && shop.cartState !== "error" && !cart)
  ) {
    return (
      <div>
        {header}
        <Skeleton className="mt-2.5 h-4 w-16" />
        <CartSkeleton />
      </div>
    );
  }

  if (status === "anonymous") {
    return (
      <div>
        {header}
        <SignInPrompt
          icon={ShoppingBagIcon}
          title="Sign in to see your cart"
          copy="Your cart is saved to your account, so it follows you across devices. Sign in to pick up where you left off."
          nextPath="/cart"
        />
      </div>
    );
  }

  if (!cart) {
    return (
      <div>
        {header}
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed px-6 py-20 text-center">
          <p className="font-heading text-xl font-medium">
            Couldn’t load your cart
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Something went wrong on our side. Give it another try.
          </p>
          <Button className="mt-6" onClick={shop.reloadCart}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const { lines } = cart;
  const freeDelivery = cart.subtotal >= FREE_DELIVERY_MIN;
  const deliveryFee = freeDelivery ? 0 : DELIVERY_FEE;
  const total = cart.subtotal + (lines.length > 0 ? deliveryFee : 0);
  const untilFreeDelivery = FREE_DELIVERY_MIN - cart.subtotal;
  const compareSavings = lines.reduce(
    (sum, line) =>
      line.isAvailable &&
      line.compareAtPrice !== null &&
      line.compareAtPrice > line.unitPrice
        ? sum + (line.compareAtPrice - line.unitPrice) * line.quantity
        : sum,
    0,
  );

  return (
    <div>
      {header}
      <p className="mt-1.5 text-sm text-muted-foreground">
        {cart.totalQuantity} {cart.totalQuantity === 1 ? "item" : "items"}
      </p>

      {lines.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed px-6 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-accent/70">
            <ShoppingBagIcon className="size-6 text-brand" />
          </span>
          <p className="font-heading mt-4 text-xl font-medium">
            Your cart is empty
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Looks like you haven’t added anything yet — new pieces land every
            week.
          </p>
          <Button className="mt-6" render={<Link href="/products" />}>
            Start shopping
            <ArrowRightIcon />
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-10 lg:flex-row lg:gap-12">
          <div className="min-w-0 flex-1">
            {actionError && (
              <p
                role="alert"
                className="mb-3 rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {actionError}
              </p>
            )}

            <ul className="divide-y">
              {lines.map((line) => {
                const busy = pending !== null;
                const lineCompare =
                  line.compareAtPrice !== null &&
                  line.compareAtPrice > line.unitPrice
                    ? line.compareAtPrice * line.quantity
                    : null;
                return (
                  <li key={line.id} className="flex gap-4 py-5 sm:gap-5">
                    <Link
                      href={`/products/${line.slug}`}
                      className="shrink-0"
                      tabIndex={-1}
                    >
                      <ProductThumb
                        title={line.title}
                        image={line.image}
                        seed={line.slug}
                        className={cn(
                          "aspect-3/4 w-20 rounded-xl sm:w-24",
                          !line.isAvailable && "opacity-55 grayscale-25",
                        )}
                        sizes="96px"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-sm font-medium">
                            <Link
                              href={`/products/${line.slug}`}
                              className="transition-colors hover:text-brand"
                            >
                              {line.title}
                            </Link>
                          </h3>
                          {line.variantLabel && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {line.variantLabel}
                            </p>
                          )}
                          {!line.isAvailable && line.unavailableReason && (
                            <p className="mt-1 text-xs font-medium text-destructive">
                              {UNAVAILABLE_REASON_LABEL[line.unavailableReason]}
                            </p>
                          )}
                          {line.isAvailable && line.priceDropped && (
                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-brand">
                              <TrendingDownIcon className="size-3.5" />
                              Price dropped since you added this
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${line.title} from cart`}
                          disabled={busy}
                          onClick={() =>
                            mutate(line.id, () => shop.removeLine(line.id))
                          }
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                        >
                          <XIcon className="size-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                        <div className="flex flex-wrap items-center gap-3">
                          {line.isAvailable && (
                            <div className="flex items-center rounded-lg border">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Decrease quantity"
                                disabled={busy || line.quantity <= 1}
                                onClick={() =>
                                  mutate(line.id, () =>
                                    shop.updateQuantity(
                                      line.id,
                                      line.quantity - 1,
                                    ),
                                  )
                                }
                              >
                                <MinusIcon />
                              </Button>
                              <span className="w-8 text-center text-sm font-semibold tabular-nums">
                                {line.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Increase quantity"
                                disabled={busy || line.quantity >= line.maxQuantity}
                                onClick={() =>
                                  mutate(line.id, () =>
                                    shop.updateQuantity(
                                      line.id,
                                      line.quantity + 1,
                                    ),
                                  )
                                }
                              >
                                <PlusIcon />
                              </Button>
                            </div>
                          )}
                          {line.isAvailable && line.available <= 5 && (
                            <span className="text-xs font-medium text-brand">
                              Only {line.available} left
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              mutate(line.id, () =>
                                shop.moveToWishlist(line.id),
                              )
                            }
                            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-brand disabled:opacity-50"
                          >
                            <HeartIcon className="size-3.5" />
                            Save for later
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {formatPrice(line.lineTotal)}
                          </p>
                          {lineCompare !== null && line.isAvailable && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatPrice(lineCompare)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <Link
              href="/products"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              <ArrowLeftIcon className="size-4" />
              Continue shopping
            </Link>
          </div>

          <div className="w-full shrink-0 lg:w-96">
            <div className="rounded-2xl border bg-card p-6 lg:sticky lg:top-32">
              <h2 className="font-heading text-lg font-medium">
                Order Summary
              </h2>

              {cart.hasUnavailableItems && (
                <div className="mt-4 rounded-xl bg-destructive/10 px-3.5 py-3 text-xs text-destructive">
                  <p>
                    {cart.unavailableCount}{" "}
                    {cart.unavailableCount === 1 ? "item is" : "items are"} no
                    longer available and won’t be charged.
                  </p>
                  <button
                    type="button"
                    disabled={pending !== null}
                    onClick={() =>
                      mutate("cart", () => shop.removeUnavailable())
                    }
                    className="mt-1.5 font-semibold underline-offset-2 hover:underline disabled:opacity-50"
                  >
                    Remove unavailable items
                  </button>
                </div>
              )}

              {freeDelivery ? (
                <p className="mt-4 flex items-center gap-2.5 rounded-xl bg-accent/60 px-3.5 py-3 text-xs text-foreground/85">
                  <TruckIcon className="size-4 shrink-0 text-brand" />
                  Free delivery inside Dhaka unlocked
                </p>
              ) : (
                <div className="mt-4 rounded-xl bg-accent/60 px-3.5 py-3">
                  <p className="flex items-center gap-2.5 text-xs text-foreground/85">
                    <TruckIcon className="size-4 shrink-0 text-brand" />
                    Add {formatPrice(untilFreeDelivery)} more for free delivery
                    inside Dhaka
                  </p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-300"
                      style={{
                        width: `${Math.min(100, (cart.subtotal / FREE_DELIVERY_MIN) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <Separator className="my-5" />

              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Subtotal ({cart.totalQuantity}{" "}
                    {cart.totalQuantity === 1 ? "item" : "items"})
                  </dt>
                  <dd className="font-medium">{formatPrice(cart.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Delivery</dt>
                  <dd className="font-medium">
                    {freeDelivery ? "Free" : formatPrice(deliveryFee)}
                  </dd>
                </div>
                {compareSavings > 0 && (
                  <div className="flex justify-between text-brand">
                    <dt>You’re saving</dt>
                    <dd className="font-medium">
                      {formatPrice(compareSavings)}
                    </dd>
                  </div>
                )}
              </dl>

              <Separator className="my-5" />

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Total</span>
                <span className="text-2xl font-semibold">
                  {formatPrice(total)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Delivery outside Dhaka calculated at checkout
              </p>

              {cart.hasUnavailableItems || cart.subtotal === 0 ? (
                <Button size="lg" className="mt-5 h-11 w-full text-base" disabled>
                  Proceed to Checkout
                  <ArrowRightIcon />
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="mt-5 h-11 w-full text-base"
                  render={<Link href="/checkout" />}
                >
                  Proceed to Checkout
                  <ArrowRightIcon />
                </Button>
              )}
              {cart.hasUnavailableItems && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Remove unavailable items to check out
                </p>
              )}

              <Separator className="my-5" />

              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2.5">
                  <TruckIcon className="size-4 shrink-0 text-brand" />
                  Nationwide delivery — all 64 districts
                </li>
                <li className="flex items-center gap-2.5">
                  <HandCoinsIcon className="size-4 shrink-0 text-brand" />
                  Cash on Delivery, bKash or card
                </li>
                <li className="flex items-center gap-2.5">
                  <RefreshCcwIcon className="size-4 shrink-0 text-brand" />
                  7-day easy returns
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
