"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  HandCoinsIcon,
  MinusIcon,
  PlusIcon,
  RefreshCcwIcon,
  ShoppingBagIcon,
  TicketPercentIcon,
  TruckIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ProductThumb } from "@/components/product/product-thumb";
import { formatPrice } from "@/lib/format";
import type { CartLine } from "@/lib/api/cart";

const FREE_DELIVERY_MIN = 2000;
const DELIVERY_FEE = 80;
const PROMO = { code: "LEGACY10", percent: 10 };

export function CartView({ initialLines }: { initialLines: CartLine[] }) {
  const [lines, setLines] = React.useState(initialLines);
  const [promoInput, setPromoInput] = React.useState("");
  const [appliedPromo, setAppliedPromo] = React.useState<string | null>(null);
  const [promoError, setPromoError] = React.useState<string | null>(null);

  const changeQuantity = (id: string, delta: number) =>
    setLines((current) =>
      current.map((line) =>
        line.id === id
          ? {
              ...line,
              quantity: Math.min(
                line.stock,
                Math.max(1, line.quantity + delta)
              ),
            }
          : line
      )
    );

  const removeLine = (id: string) =>
    setLines((current) => current.filter((line) => line.id !== id));

  const applyPromo = (event: React.FormEvent) => {
    event.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (code === PROMO.code) {
      setAppliedPromo(code);
      setPromoError(null);
      setPromoInput("");
    } else {
      setPromoError(`“${code}” is not a valid code`);
    }
  };

  const itemCount = lines.reduce((n, line) => n + line.quantity, 0);
  const subtotal = lines.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0
  );
  const compareSavings = lines.reduce(
    (sum, line) =>
      line.compareAtPrice !== null && line.compareAtPrice > line.unitPrice
        ? sum + (line.compareAtPrice - line.unitPrice) * line.quantity
        : sum,
    0
  );
  const promoDiscount = appliedPromo
    ? Math.round((subtotal * PROMO.percent) / 100)
    : 0;
  const freeDelivery = subtotal - promoDiscount >= FREE_DELIVERY_MIN;
  const deliveryFee = freeDelivery ? 0 : DELIVERY_FEE;
  const total = subtotal - promoDiscount + deliveryFee;
  const untilFreeDelivery = FREE_DELIVERY_MIN - (subtotal - promoDiscount);

  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">
        Cart
      </p>
      <h1 className="font-heading mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
        Shopping Cart
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {itemCount} {itemCount === 1 ? "item" : "items"}
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
            <ul className="divide-y">
              {lines.map((line) => {
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
                        className="aspect-3/4 w-20 rounded-xl sm:w-24"
                        sizes="96px"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                            {line.categoryName}
                          </p>
                          <h3 className="mt-0.5 line-clamp-2 text-sm font-medium">
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
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${line.title} from cart`}
                          onClick={() => removeLine(line.id)}
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <XIcon className="size-4" />
                        </button>
                      </div>

                      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center rounded-lg border">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Decrease quantity"
                              disabled={line.quantity <= 1}
                              onClick={() => changeQuantity(line.id, -1)}
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
                              disabled={line.quantity >= line.stock}
                              onClick={() => changeQuantity(line.id, 1)}
                            >
                              <PlusIcon />
                            </Button>
                          </div>
                          {line.stock <= 5 && (
                            <span className="text-xs font-medium text-brand">
                              Only {line.stock} left
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {formatPrice(line.unitPrice * line.quantity)}
                          </p>
                          {lineCompare !== null && (
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
                        width: `${Math.min(100, ((subtotal - promoDiscount) / FREE_DELIVERY_MIN) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {appliedPromo ? (
                <div className="mt-4 flex items-center justify-between rounded-lg bg-brand/10 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-brand">
                    <TicketPercentIcon className="size-4" />
                    {appliedPromo} · {PROMO.percent}% off
                  </span>
                  <button
                    type="button"
                    aria-label="Remove promo code"
                    onClick={() => setAppliedPromo(null)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={applyPromo} className="mt-4">
                  <div className="flex gap-2">
                    <Input
                      value={promoInput}
                      onChange={(event) => {
                        setPromoInput(event.target.value);
                        setPromoError(null);
                      }}
                      placeholder="Promo code"
                      aria-label="Promo code"
                      className="h-9 bg-background"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      className="h-9"
                      disabled={!promoInput.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                  {promoError && (
                    <p className="mt-1.5 text-xs text-destructive">
                      {promoError}
                    </p>
                  )}
                </form>
              )}

              <Separator className="my-5" />

              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                  </dt>
                  <dd className="font-medium">{formatPrice(subtotal)}</dd>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-brand">
                    <dt>Promo ({appliedPromo})</dt>
                    <dd className="font-medium">
                      −{formatPrice(promoDiscount)}
                    </dd>
                  </div>
                )}
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
                      {formatPrice(compareSavings + promoDiscount)}
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

              <Button
                size="lg"
                className="mt-5 h-11 w-full text-base"
                render={<Link href="/checkout" />}
              >
                Proceed to Checkout
                <ArrowRightIcon />
              </Button>

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
