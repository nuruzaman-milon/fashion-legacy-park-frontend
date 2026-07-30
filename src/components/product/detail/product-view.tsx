"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckIcon,
  HandCoinsIcon,
  HeartIcon,
  MinusIcon,
  PlusIcon,
  RefreshCcwIcon,
  ShoppingBagIcon,
  TruckIcon,
  ZapIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { useShop } from "@/components/shop/shop-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RatingStars } from "@/components/product/rating-stars";
import { ApiError } from "@/lib/api/client";
import { discountPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "@/types/catalog";

const ADDED_FEEDBACK_MS = 2000;

export function ProductView({ product }: { product: ProductDetail }) {
  // One selected value per option group, defaulting to the first value.
  const [selected, setSelected] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(product.options.map((g) => [g.id, g.values[0].id]))
  );
  const [imageIndex, setImageIndex] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);

  const selectedIds = Object.values(selected);
  // A combination without a variant (the backend only creates the ones the
  // seller generated) sells as out of stock; the default variant stands in
  // for price display only.
  const matched = product.variants.find((v) =>
    v.optionValueIds.every((id) => selectedIds.includes(id))
  );
  const variant = matched ?? product.variants[0];

  // The gallery always shows every shot; picking a colour jumps the main
  // image to that colour's photo (thumbnails stay browsable).
  const colorGroup = product.options.find((g) => g.displayType === "SWATCH");
  const gallery = product.images;
  const activeImage = gallery[Math.min(imageIndex, gallery.length - 1)];

  const sale = product.flashSale;
  const salePct = sale ? sale.flashPrice / product.minPrice : 1;
  const price = Math.round(variant.price * salePct);
  const compareAt = sale ? variant.price : variant.comparePrice;
  const hasDiscount = compareAt !== null && compareAt > price;

  const outOfStock = !matched || matched.stock === 0;
  const lowStock =
    !outOfStock && variant.stock <= product.lowStockThreshold;

  // Cart & wishlist are login-only (docs/cart.md) — anonymous clicks go to
  // /login and come back here via ?next=. Heart state and adds go through
  // the shared shop provider: local state flips instantly, the backend
  // syncs behind it, and failures roll back with a message.
  const { status } = useAuth();
  const shop = useShop();
  const router = useRouter();
  const pathname = usePathname();
  const [cartState, setCartState] = React.useState<
    "idle" | "busy" | "added"
  >("idle");
  const [actionError, setActionError] = React.useState<string | null>(null);
  const addedTimer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(addedTimer.current), []);

  const hearted = status === "authenticated" && shop.isWishlisted(product.id);

  const requireLogin = () => {
    if (status === "authenticated") return false;
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
    return true;
  };

  const showError = (error: unknown) =>
    setActionError(
      error instanceof ApiError
        ? error.message
        : "Something went wrong — please try again.",
    );

  const handleAddToCart = async (thenCheckout: boolean) => {
    if (requireLogin() || !matched) return;
    setActionError(null);
    if (thenCheckout) {
      // Navigating to checkout needs the confirmed cart — wait for it.
      setCartState("busy");
      try {
        await shop.addToCart(matched.id, quantity);
        router.push("/checkout");
        return;
      } catch (error) {
        showError(error);
      }
      setCartState("idle");
      return;
    }
    // Optimistic: confirm instantly, roll back to an error if the backend
    // refuses (e.g. someone else took the last unit).
    setCartState("added");
    addedTimer.current = window.setTimeout(
      () => setCartState("idle"),
      ADDED_FEEDBACK_MS,
    );
    shop.addToCart(matched.id, quantity).catch((error) => {
      window.clearTimeout(addedTimer.current);
      setCartState("idle");
      showError(error);
    });
  };

  const handleToggleWishlist = () => {
    if (requireLogin()) return;
    setActionError(null);
    // The provider flips the heart immediately and restores it on failure.
    shop.toggleWishlist(product.id).catch(showError);
  };

  const selectValue = (groupId: string, valueId: string) => {
    setSelected((s) => ({ ...s, [groupId]: valueId }));
    if (colorGroup && groupId === colorGroup.id) {
      const idx = product.images.findIndex(
        (img) => img.optionValueId === valueId
      );
      showImage(idx >= 0 ? idx : 0);
    }
    setQuantity(1);
  };

  // Zoom. Mouse: hover zooms and the focus follows the cursor. Touch: tap
  // toggles zoom at the tapped spot, dragging pans while zoomed. Pan writes
  // go straight to the DOM (no re-renders); only the tap toggle is state.
  const zoomWrapRef = React.useRef<HTMLDivElement | null>(null);
  const zoomImgRef = React.useRef<HTMLImageElement | null>(null);
  const touchGestureRef = React.useRef({ startX: 0, startY: 0, dragged: false });
  const [touchZoomed, setTouchZoomed] = React.useState(false);

  const setZoomAt = (clientX: number, clientY: number) => {
    const wrap = zoomWrapRef.current;
    const img = zoomImgRef.current;
    if (!wrap || !img) return;
    const rect = wrap.getBoundingClientRect();
    const x = Math.min(
      100,
      Math.max(0, ((clientX - rect.left) / rect.width) * 100)
    );
    const y = Math.min(
      100,
      Math.max(0, ((clientY - rect.top) / rect.height) * 100)
    );
    img.style.transformOrigin = `${x}% ${y}%`;
    img.style.transform = "scale(2.2)";
  };

  const clearZoom = () => {
    const img = zoomImgRef.current;
    if (!img) return;
    img.style.transform = "";
    img.style.transformOrigin = "";
  };

  const onZoomPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    touchGestureRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      dragged: false,
    };
  };

  const onZoomPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") {
      setZoomAt(e.clientX, e.clientY);
      return;
    }
    const gesture = touchGestureRef.current;
    if (
      Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY) > 8
    ) {
      gesture.dragged = true;
    }
    if (touchZoomed && gesture.dragged) setZoomAt(e.clientX, e.clientY);
  };

  const onZoomPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType !== "touch" || touchGestureRef.current.dragged) return;
    if (touchZoomed) {
      clearZoom();
      setTouchZoomed(false);
    } else {
      setZoomAt(e.clientX, e.clientY);
      setTouchZoomed(true);
    }
  };

  const onZoomPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") clearZoom();
  };

  const showImage = (index: number) => {
    setImageIndex(index);
    setTouchZoomed(false);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <div className="flex flex-col gap-3 lg:flex-row">
        {gallery.length > 1 && (
          <div className="order-last flex gap-2.5 overflow-x-auto lg:order-first lg:flex-col lg:overflow-visible">
            {gallery.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => showImage(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === imageIndex}
                className={cn(
                  "relative aspect-3/4 w-16 shrink-0 overflow-hidden rounded-lg transition-all",
                  i === imageIndex
                    ? "ring-2 ring-brand"
                    : "opacity-60 ring-1 ring-border hover:opacity-100"
                )}
              >
                <Image
                  src={img.src}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        <div
          ref={zoomWrapRef}
          onPointerDown={onZoomPointerDown}
          onPointerMove={onZoomPointerMove}
          onPointerUp={onZoomPointerUp}
          onPointerLeave={onZoomPointerLeave}
          style={{ touchAction: touchZoomed ? "none" : "manipulation" }}
          className="group/zoom relative aspect-3/4 min-w-0 flex-1 cursor-zoom-in overflow-hidden rounded-2xl bg-muted lg:self-start"
        >
          {activeImage && (
            <Image
              key={activeImage.src}
              ref={zoomImgRef}
              src={activeImage.src}
              alt={activeImage.alt}
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover transition-transform duration-200 ease-out"
            />
          )}
          <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
            {hasDiscount && (
              <Badge className="bg-brand text-brand-foreground">
                −{discountPercent(price, compareAt)}%
              </Badge>
            )}
            {product.isNew && <Badge variant="secondary">New</Badge>}
          </div>
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition-opacity",
              !touchZoomed && "lg:group-hover/zoom:opacity-0"
            )}
          >
            {touchZoomed ? (
              <ZoomOutIcon className="size-4" />
            ) : (
              <ZoomInIcon className="size-4" />
            )}
          </span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-brand uppercase">
          {product.category.name}
        </p>
        <h1 className="mt-2 font-heading text-2xl font-medium tracking-tight text-balance sm:text-3xl">
          {product.title}
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <RatingStars
            rating={product.avgRating}
            reviewCount={product.reviewCount}
          />
          <span className="text-xs text-muted-foreground">
            · {product.soldCount} sold
          </span>
        </div>

        {product.shortDescription && (
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {product.shortDescription}
          </p>
        )}

        <div className="mt-5 flex items-baseline gap-3">
          <span className="text-3xl font-semibold">{formatPrice(price)}</span>
          {hasDiscount && (
            <span className="text-lg text-muted-foreground line-through">
              {formatPrice(compareAt)}
            </span>
          )}
          {sale && (
            <Badge className="bg-brand text-brand-foreground">
              <ZapIcon className="fill-current" /> Flash sale
            </Badge>
          )}
        </div>
        {sale?.quantityLimit && (
          <div className="mt-3 max-w-xs">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand"
                style={{
                  width: `${Math.min(100, (sale.soldCount / sale.quantityLimit) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {sale.soldCount} of {sale.quantityLimit} sold at this price
            </p>
          </div>
        )}

        <Separator className="my-6" />

        <div className="space-y-5">
          {product.options.map((group) => {
            const activeValue = group.values.find(
              (v) => v.id === selected[group.id]
            );
            return (
              <div key={group.id}>
                <p className="mb-2.5 text-sm font-medium">
                  {group.name}
                  {activeValue && (
                    <span className="ml-1.5 text-muted-foreground">
                      · {activeValue.label}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.values.map((value) => {
                    // Muted when no variant with this value has stock left
                    // (`inStockValueIds`, docs API-HOMEPAGE.md §7). Still
                    // clickable — the selection then reads "Out of stock".
                    const soldOut = !product.inStockValueIds.includes(value.id);
                    return group.displayType === "SWATCH" ? (
                      <button
                        key={value.id}
                        type="button"
                        title={
                          soldOut ? `${value.label} — out of stock` : value.label
                        }
                        aria-label={`${group.name}: ${value.label}`}
                        aria-current={selected[group.id] === value.id}
                        onClick={() => selectValue(group.id, value.id)}
                        className={cn(
                          "size-9 rounded-full border-2 transition-all",
                          selected[group.id] === value.id
                            ? "border-brand ring-2 ring-brand/30"
                            : "border-border hover:border-foreground/40",
                          soldOut && "opacity-40"
                        )}
                        style={{ background: value.hexColor ?? undefined }}
                      />
                    ) : (
                      <button
                        key={value.id}
                        type="button"
                        aria-current={selected[group.id] === value.id}
                        onClick={() => selectValue(group.id, value.id)}
                        className={cn(
                          "h-9 min-w-11 rounded-lg border px-3 text-sm font-medium transition-all",
                          selected[group.id] === value.id
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-border hover:border-foreground/40",
                          soldOut && "text-muted-foreground line-through opacity-60"
                        )}
                      >
                        {value.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-lg border">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Decrease quantity"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <MinusIcon />
              </Button>
              <span className="w-10 text-center text-sm font-semibold tabular-nums">
                {quantity}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Increase quantity"
                disabled={outOfStock || quantity >= variant.stock}
                onClick={() =>
                  setQuantity((q) => Math.min(variant.stock, q + 1))
                }
              >
                <PlusIcon />
              </Button>
            </div>
            {outOfStock ? (
              <span className="text-sm font-medium text-destructive">
                Out of stock
              </span>
            ) : lowStock ? (
              <span className="text-sm font-medium text-brand">
                Only {variant.stock} left
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">In stock</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className={cn(
                "h-11 flex-1 px-6 text-base sm:flex-none",
                cartState === "added" &&
                  "bg-brand text-brand-foreground hover:bg-brand"
              )}
              disabled={outOfStock || cartState === "busy"}
              onClick={() => handleAddToCart(false)}
            >
              {cartState === "added" ? (
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
              size="lg"
              className="h-11 flex-1 bg-brand px-6 text-base text-brand-foreground hover:bg-brand/85 sm:flex-none"
              disabled={outOfStock || cartState === "busy"}
              onClick={() => handleAddToCart(true)}
            >
              <ZapIcon />
              Buy Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className={cn("size-11", hearted && "text-brand")}
              aria-label={hearted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={hearted}
              onClick={handleToggleWishlist}
            >
              <HeartIcon className={cn(hearted && "fill-current")} />
            </Button>
          </div>
          {actionError && (
            <p role="alert" className="text-sm text-destructive">
              {actionError}
            </p>
          )}

          <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>
        </div>

        <Separator className="my-6" />

        <ul className="space-y-2.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2.5">
            <TruckIcon className="size-4 text-brand" />
            Nationwide delivery — all 64 districts
          </li>
          <li className="flex items-center gap-2.5">
            <HandCoinsIcon className="size-4 text-brand" />
            Cash on Delivery, bKash or card
          </li>
          <li className="flex items-center gap-2.5">
            <RefreshCcwIcon className="size-4 text-brand" />
            7-day easy returns
          </li>
        </ul>
      </div>
    </div>
  );
}
