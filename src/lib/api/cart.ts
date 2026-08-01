import { apiFetch } from "./client";

/**
 * Cart for the current shopper — docs/cart.md. Login required (no guest
 * cart), so everything goes through the client-side `apiFetch` with the
 * Bearer token; server components never call these.
 *
 * Every write endpoint returns the whole updated cart, so each mutation
 * resolves to the fresh `Cart` and the UI never needs a follow-up GET.
 */

interface ApiCartItem {
  id: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  isAvailable: boolean;
  unavailableReason:
    | "PRODUCT_UNAVAILABLE"
    | "SELLER_UNAVAILABLE"
    | "VARIANT_INACTIVE"
    | "OUT_OF_STOCK"
    | "INSUFFICIENT_STOCK"
    | null;
  maxQuantity: number;
  priceChanged: boolean;
  priceDropped: boolean;
  /** unitPrice is the live flash-sale price; variant.price is the regular. */
  onFlashSale: boolean;
  addedPrice: string;
  variant: {
    id: string;
    name: string;
    sku: string;
    price: string;
    comparePrice: string | null;
    available: number;
  };
  product: { id: string; name: string; slug: string; image: string | null };
}

export interface ApiCart {
  id: string;
  items: ApiCartItem[];
  summary: {
    itemCount: number;
    totalQuantity: number;
    subtotal: string;
    unavailableCount: number;
    hasUnavailableItems: boolean;
  };
}

export interface CartLine {
  id: string;
  productId: string;
  variantId: string;
  slug: string;
  title: string;
  image: string | null;
  /** Chosen variant, e.g. "Red / M" — null for single-variant products. */
  variantLabel: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  /** True when the price moved since the line was added (informational). */
  priceChanged: boolean;
  priceDropped: boolean;
  /** unitPrice is the flash price; compareAtPrice holds the regular price. */
  onFlashSale: boolean;
  isAvailable: boolean;
  unavailableReason: ApiCartItem["unavailableReason"];
  /** What the backend will accept for this line — clamps the stepper. */
  maxQuantity: number;
  /** Remaining purchasable stock of the variant. */
  available: number;
  quantity: number;
  lineTotal: number;
}

export interface Cart {
  lines: CartLine[];
  /** Distinct lines. */
  itemCount: number;
  totalQuantity: number;
  /** Available lines only — matches what checkout would charge. */
  subtotal: number;
  unavailableCount: number;
  hasUnavailableItems: boolean;
}

/** Human copy for the availability flags (docs/cart.md). */
export const UNAVAILABLE_REASON_LABEL: Record<
  NonNullable<ApiCartItem["unavailableReason"]>,
  string
> = {
  PRODUCT_UNAVAILABLE: "No longer available",
  SELLER_UNAVAILABLE: "No longer available",
  VARIANT_INACTIVE: "This option was discontinued",
  OUT_OF_STOCK: "Out of stock",
  INSUFFICIENT_STOCK: "Not enough stock left",
};

export function mapCart(api: ApiCart): Cart {
  return {
    lines: api.items.map((item) => ({
      id: item.id,
      productId: item.product.id,
      variantId: item.variant.id,
      slug: item.product.slug,
      title: item.product.name,
      image: item.product.image,
      variantLabel: item.variant.name === "Default" ? null : item.variant.name,
      unitPrice: Number(item.unitPrice),
      // On flash sale the regular price is the strikethrough anchor — it
      // beats comparePrice, which anchors the everyday discount instead.
      compareAtPrice: item.onFlashSale
        ? Number(item.variant.price)
        : item.variant.comparePrice === null
          ? null
          : Number(item.variant.comparePrice),
      priceChanged: item.priceChanged,
      priceDropped: item.priceDropped,
      onFlashSale: item.onFlashSale,
      isAvailable: item.isAvailable,
      unavailableReason: item.unavailableReason,
      maxQuantity: item.maxQuantity,
      available: item.variant.available,
      quantity: item.quantity,
      lineTotal: Number(item.lineTotal),
    })),
    itemCount: api.summary.itemCount,
    totalQuantity: api.summary.totalQuantity,
    subtotal: Number(api.summary.subtotal),
    unavailableCount: api.summary.unavailableCount,
    hasUnavailableItems: api.summary.hasUnavailableItems,
  };
}

export async function getCart(): Promise<Cart> {
  return mapCart(await apiFetch<ApiCart>("/cart"));
}

export async function addToCart(
  variantId: string,
  quantity: number,
): Promise<Cart> {
  return mapCart(
    await apiFetch<ApiCart>("/cart/items", {
      method: "POST",
      body: { variantId, quantity },
    }),
  );
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
): Promise<Cart> {
  return mapCart(
    await apiFetch<ApiCart>(`/cart/items/${itemId}`, {
      method: "PATCH",
      body: { quantity },
    }),
  );
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  return mapCart(
    await apiFetch<ApiCart>(`/cart/items/${itemId}`, { method: "DELETE" }),
  );
}

export async function removeUnavailableItems(): Promise<Cart> {
  return mapCart(
    await apiFetch<ApiCart>("/cart/unavailable", { method: "DELETE" }),
  );
}

export async function moveCartItemToWishlist(itemId: string): Promise<Cart> {
  return mapCart(
    await apiFetch<ApiCart>(`/cart/items/${itemId}/move-to-wishlist`, {
      method: "POST",
    }),
  );
}
