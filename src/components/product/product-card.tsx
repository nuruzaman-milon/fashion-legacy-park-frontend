"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertCircleIcon,
  CheckIcon,
  HeartIcon,
  ShoppingBagIcon,
  ZapIcon,
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useShop } from "@/components/shop/shop-provider";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/product/rating-stars";
import { ProductThumb } from "@/components/product/product-thumb";
import { ApiError, apiFetch } from "@/lib/api/client";
import { discountPercent, formatPrice, formatPriceRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "@/types/catalog";

const ACTION_BUTTON =
  "flex size-8 items-center justify-center rounded-full bg-background/85 text-foreground opacity-0 shadow-sm backdrop-blur transition-all duration-200 group-hover:opacity-100 hover:bg-brand hover:text-brand-foreground focus-visible:opacity-100 disabled:pointer-events-none motion-reduce:transition-none";

const FEEDBACK_MS = 2000;

interface ProductCardProps {
  product: ProductListItem;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const sale = product.flashSale;
  const price = sale ? sale.flashPrice : product.minPrice;
  const compareAt = sale ? product.minPrice : product.comparePrice;
  const hasDiscount = compareAt !== null && compareAt > price;

  // Card actions are login-only (docs/cart.md); anonymous clicks go to
  // /login and return here via ?next=. The cart is variant-level, so the
  // bag/zap icons add directly only when the product has a single variant —
  // otherwise they open the product page for the size/colour picker.
  // Heart state and cart adds are optimistic via the shared shop provider.
  const { status } = useAuth();
  const shop = useShop();
  const router = useRouter();
  const pathname = usePathname();
  const hearted = status === "authenticated" && shop.isWishlisted(product.id);
  const [fx, setFx] = React.useState<"idle" | "busy" | "added" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const fxTimer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(fxTimer.current), []);

  const requireLogin = () => {
    if (status === "authenticated") return false;
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
    return true;
  };

  const flash = (state: "added" | "error", message?: string) => {
    setFx(state);
    setErrorMessage(message ?? null);
    fxTimer.current = window.setTimeout(() => setFx("idle"), FEEDBACK_MS);
  };

  const handleHeart = () => {
    if (requireLogin()) return;
    // The heart flips instantly (provider is optimistic); sync runs behind.
    shop.toggleWishlist(product.id).catch((error) => {
      flash(
        "error",
        error instanceof ApiError ? error.message : "Something went wrong",
      );
    });
  };

  const handleAdd = async (thenCheckout: boolean) => {
    if (requireLogin() || fx === "busy") return;
    setFx("busy");
    try {
      const { variants } = await apiFetch<{ variants: { id: string }[] }>(
        `/products/${encodeURIComponent(product.slug)}`,
      );
      if (variants.length !== 1) {
        router.push(`/products/${product.slug}`);
        setFx("idle");
        return;
      }
      if (thenCheckout) {
        await shop.addToCart(variants[0].id, 1);
        router.push("/checkout");
        return;
      }
      // Show success immediately — the badge already moved; if the backend
      // rejects (e.g. out of stock), the error state replaces it.
      flash("added");
      shop.addToCart(variants[0].id, 1).catch((error) => {
        flash(
          "error",
          error instanceof ApiError ? error.message : "Something went wrong",
        );
      });
    } catch (error) {
      flash(
        "error",
        error instanceof ApiError ? error.message : "Something went wrong",
      );
    }
  };

  return (
    <article className={cn("group relative isolate", className)}>
      <div className="relative">
        <ProductThumb
          title={product.title}
          image={product.image}
          seed={product.slug}
          className="aspect-3/4 rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {hasDiscount && (
            <Badge className="bg-brand text-brand-foreground">
              −{discountPercent(price, compareAt)}%
            </Badge>
          )}
          {product.isNew && !hasDiscount && (
            <Badge variant="secondary">New</Badge>
          )}
        </div>
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            title={hearted ? "Remove from wishlist" : "Add to wishlist"}
            aria-label={
              hearted
                ? `Remove ${product.title} from wishlist`
                : `Add ${product.title} to wishlist`
            }
            aria-pressed={hearted}
            onClick={handleHeart}
            className={cn(
              ACTION_BUTTON,
              hearted && "text-brand opacity-100",
            )}
          >
            <HeartIcon className={cn("size-4", hearted && "fill-current")} />
          </button>
          <button
            type="button"
            title={
              fx === "error"
                ? (errorMessage ?? "Something went wrong")
                : "Add to cart"
            }
            aria-label={`Add ${product.title} to cart`}
            disabled={fx === "busy"}
            onClick={() => handleAdd(false)}
            className={cn(
              ACTION_BUTTON,
              "delay-75",
              fx === "added" &&
                "bg-brand text-brand-foreground opacity-100",
              fx === "error" && "text-destructive opacity-100",
            )}
          >
            {fx === "added" ? (
              <CheckIcon className="size-4" />
            ) : fx === "error" ? (
              <AlertCircleIcon className="size-4" />
            ) : (
              <ShoppingBagIcon className="size-4" />
            )}
          </button>
          <button
            type="button"
            title="Buy now"
            aria-label={`Buy ${product.title} now`}
            disabled={fx === "busy"}
            onClick={() => handleAdd(true)}
            className={cn(ACTION_BUTTON, "delay-150")}
          >
            <ZapIcon className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        {/* Flash-sale items arrive without a category (API-HOMEPAGE.md §4). */}
        {product.category.name && (
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {product.category.name}
          </p>
        )}
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">
          <Link
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0"
          >
            {product.title}
          </Link>
        </h3>
        <RatingStars rating={product.avgRating} reviewCount={product.reviewCount} />
        <p className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">
            {sale || product.minPrice === product.maxPrice
              ? formatPrice(price)
              : formatPriceRange(product.minPrice, product.maxPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(compareAt)}
            </span>
          )}
        </p>
        {sale?.quantityLimit && (
          <div className="mt-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand"
                style={{
                  width: `${Math.min(100, (sale.soldCount / sale.quantityLimit) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {sale.soldCount} of {sale.quantityLimit} sold
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
