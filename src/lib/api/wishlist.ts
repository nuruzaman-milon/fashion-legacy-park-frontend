import { mapCart, type ApiCart, type Cart } from "./cart";
import { apiFetch } from "./client";

/**
 * Wishlist for the current shopper — docs/cart.md. Product-level (a heart
 * saves the product, not a variant) and login-required, so everything goes
 * through the client-side `apiFetch`.
 */

interface ApiWishlistEntry {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    minPrice: string;
    maxPrice: string;
    avgRating: number;
    reviewCount: number;
    category: { name: string; slug: string };
    images: { url: string; alt: string | null }[];
  };
  isPurchasable: boolean;
  isInStock: boolean;
}

export interface WishlistItem {
  productId: string;
  slug: string;
  title: string;
  categoryName: string;
  image: string | null;
  minPrice: number;
  maxPrice: number;
  avgRating: number;
  reviewCount: number;
  /** False when stock ran out — rendered greyed, never silently dropped. */
  isInStock: boolean;
  /** False when the product was withdrawn or its seller suspended. */
  isPurchasable: boolean;
}

/** Covers any realistic wishlist in one page. */
const WISHLIST_LIMIT = 100;

function mapEntry(entry: ApiWishlistEntry): WishlistItem {
  return {
    productId: entry.productId,
    slug: entry.product.slug,
    title: entry.product.name,
    categoryName: entry.product.category.name,
    image: entry.product.images[0]?.url ?? null,
    minPrice: Number(entry.product.minPrice),
    maxPrice: Number(entry.product.maxPrice),
    avgRating: entry.product.avgRating,
    reviewCount: entry.product.reviewCount,
    isInStock: entry.isInStock,
    isPurchasable: entry.isPurchasable,
  };
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const { items } = await apiFetch<{ items: ApiWishlistEntry[] }>(
    `/wishlist?limit=${WISHLIST_LIMIT}`,
  );
  return items.map(mapEntry);
}

/** Heart icon — resolves to the resulting state. Idempotent server-side. */
export async function toggleWishlist(productId: string): Promise<boolean> {
  const { wishlisted } = await apiFetch<{ wishlisted: boolean }>(
    `/wishlist/${productId}/toggle`,
    { method: "POST" },
  );
  return wishlisted;
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await apiFetch(`/wishlist/${productId}`, { method: "DELETE" });
}

/**
 * `variantId` is required — the wishlist is product-level, the cart is
 * variant-level, and the backend refuses to guess a size or colour.
 * Returns the updated cart; the wishlist entry is gone only if it succeeds.
 */
export async function moveWishlistItemToCart(
  productId: string,
  variantId: string,
  quantity = 1,
): Promise<Cart> {
  return mapCart(
    await apiFetch<ApiCart>(`/wishlist/${productId}/move-to-cart`, {
      method: "POST",
      body: { variantId, quantity },
    }),
  );
}
