import type { HomeData } from "@/types/catalog";

import {
  mockBanner,
  mockCategories,
  mockFlashSaleItems,
  mockProducts,
} from "./mock/home-data";

/**
 * Data-access layer for the storefront. Server components call these
 * functions and stay unchanged when the real backend lands — only the
 * bodies here switch from mock data to `fetch(`${API_URL}/…`)`.
 */

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function getHomeData(): Promise<HomeData> {
  const now = Date.now();
  const products = mockProducts.map((p) => ({
    ...p,
    isNew: now - new Date(p.publishedAt).getTime() < NEW_WINDOW_MS,
  }));

  const flashItems = products
    .filter((p) => p.id in mockFlashSaleItems)
    .map((p) => ({ ...p, flashSale: mockFlashSaleItems[p.id] }));

  const endsAt = new Date();
  endsAt.setHours(24, 0, 0, 0); // sale window closes at midnight

  return {
    banner: mockBanner,
    categories: mockCategories,
    flashSale: {
      title: "Flash Sale",
      endsAt: endsAt.toISOString(),
      items: flashItems,
    },
    featured: products.filter((p) => p.isFeatured),
    newArrivals: [...products]
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, 8),
    bestSellers: [...products]
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 6),
  };
}
