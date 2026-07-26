import { mockProducts } from "./mock/home-data";

/**
 * Saved-for-later items for the current shopper. Mock-backed for now — the
 * body swaps to `fetch()` when the real backend lands (same shape as `cart.ts`).
 */

export interface WishlistItem {
  id: string;
  productId: string;
  slug: string;
  title: string;
  categoryName: string;
  image: string | null;
  price: number;
  comparePrice: number | null;
  avgRating: number;
  reviewCount: number;
  /** Live stock for the product — 0 renders the out-of-stock treatment. */
  stock: number;
}

const ITEMS = [
  { productId: "p2", stock: 26 },
  { productId: "p6", stock: 22 },
  { productId: "p12", stock: 3 },
  { productId: "p9", stock: 0 },
  { productId: "p8", stock: 30 },
];

export async function getWishlist(): Promise<WishlistItem[]> {
  return ITEMS.flatMap((item, index) => {
    const product = mockProducts.find((p) => p.id === item.productId);
    if (!product) return [];
    return [
      {
        id: `wl${index + 1}`,
        productId: product.id,
        slug: product.slug,
        title: product.title,
        categoryName: product.category.name,
        image: product.image,
        price: product.minPrice,
        comparePrice: product.comparePrice,
        avgRating: product.avgRating,
        reviewCount: product.reviewCount,
        stock: item.stock,
      },
    ];
  });
}
