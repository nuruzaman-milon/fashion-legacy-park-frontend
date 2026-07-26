import type {
  CategorySummary,
  ProductDetail,
  ProductImageInfo,
  ProductListItem,
  ProductOptionGroup,
  ProductVariantInfo,
} from "@/types/catalog";

import { mockCategories, mockFlashSaleItems, mockProducts } from "./mock/home-data";
import {
  APPAREL_SIZES,
  SHOE_SIZES,
  detailConfigs,
  reviewsFor,
} from "./mock/product-detail";

/**
 * Product data-access layer. Server components call these functions; the
 * bodies switch from mock assembly to real `fetch` calls when the backend
 * lands — signatures stay the same.
 */

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function withDerived(p: (typeof mockProducts)[number]): ProductListItem {
  return {
    ...p,
    isNew: Date.now() - new Date(p.publishedAt).getTime() < NEW_WINDOW_MS,
    flashSale: mockFlashSaleItems[p.id] ?? null,
  };
}

function hashOf(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 9973;
  }
  return hash;
}

export async function getAllProductSlugs(): Promise<string[]> {
  return mockProducts.map((p) => p.slug);
}

export async function getCategories(): Promise<CategorySummary[]> {
  return mockCategories;
}

export type ProductSort =
  | "featured"
  | "newest"
  | "best-selling"
  | "price-asc"
  | "price-desc"
  | "rating";

export interface ProductListQuery {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Minimum average rating. */
  rating?: number;
  /** Only products with an active discount (compare price or flash sale). */
  onSale?: boolean;
  sort?: ProductSort;
}

/** Price a buyer actually pays right now — flash price when one is active. */
function effectivePrice(p: ProductListItem): number {
  return p.flashSale ? p.flashSale.flashPrice : p.minPrice;
}

export async function getProducts(
  query: ProductListQuery = {}
): Promise<{ products: ProductListItem[]; total: number }> {
  let products = mockProducts.map(withDerived);

  if (query.category) {
    products = products.filter((p) => p.category.slug === query.category);
  }
  if (query.minPrice !== undefined) {
    products = products.filter((p) => effectivePrice(p) >= query.minPrice!);
  }
  if (query.maxPrice !== undefined) {
    products = products.filter((p) => effectivePrice(p) <= query.maxPrice!);
  }
  if (query.rating !== undefined) {
    products = products.filter((p) => p.avgRating >= query.rating!);
  }
  if (query.onSale) {
    products = products.filter(
      (p) =>
        p.flashSale || (p.comparePrice !== null && p.comparePrice > p.minPrice)
    );
  }

  switch (query.sort ?? "featured") {
    case "newest":
      products.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      break;
    case "best-selling":
      products.sort((a, b) => b.soldCount - a.soldCount);
      break;
    case "price-asc":
      products.sort((a, b) => effectivePrice(a) - effectivePrice(b));
      break;
    case "price-desc":
      products.sort((a, b) => effectivePrice(b) - effectivePrice(a));
      break;
    case "rating":
      products.sort((a, b) => b.avgRating - a.avgRating);
      break;
    default:
      products.sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          b.soldCount - a.soldCount
      );
  }

  return { products, total: products.length };
}

/** Synonyms/aliases a shopper may type that the titles don't contain. */
const SEARCH_KEYWORDS: Record<string, string> = {
  "scarlet-party-gown": "dress red party",
  "sky-wrap-maxi-dress": "dress blue",
  "ivory-floral-wrap-dress": "white",
  "chambray-casual-shirt": "blue",
  "essential-crew-tee": "t-shirt tshirt",
  "midnight-slim-blazer": "suit black",
  "crimson-knit-sneakers": "shoes red running",
  "teal-suede-brogues": "shoes formal",
  "azure-floral-heels": "shoes blue",
  "velvet-red-lip-duo": "lipstick makeup",
  "daily-skincare-trio": "beauty",
  "pro-makeup-collection": "beauty palette",
};

export async function searchProducts(
  term: string
): Promise<{ products: ProductListItem[]; total: number }> {
  const words = term.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { products: [], total: 0 };

  // Every word must appear in the title, category name or keyword aliases;
  // title hits rank above the rest, ties broken by popularity.
  const scored = mockProducts.map(withDerived).flatMap((p) => {
    const title = p.title.toLowerCase();
    const haystack = `${title} ${p.category.name.toLowerCase()} ${SEARCH_KEYWORDS[p.slug] ?? ""}`;
    if (!words.every((w) => haystack.includes(w))) return [];
    const score = words.reduce((s, w) => s + (title.includes(w) ? 2 : 1), 0);
    return [{ p, score }];
  });
  scored.sort((a, b) => b.score - a.score || b.p.soldCount - a.p.soldCount);

  const products = scored.map((s) => s.p);
  return { products, total: products.length };
}

export async function getRelatedProducts(
  categorySlug: string,
  excludeId: string
): Promise<ProductListItem[]> {
  return mockProducts
    .filter((p) => p.category.slug === categorySlug && p.id !== excludeId)
    .map(withDerived);
}

export async function getProductBySlug(
  slug: string
): Promise<ProductDetail | null> {
  const base = mockProducts.find((p) => p.slug === slug);
  const config = detailConfigs[slug];
  if (!base || !config) return null;

  const options: ProductOptionGroup[] = [];

  if (config.colors) {
    options.push({
      id: "color",
      name: "Color",
      displayType: "SWATCH",
      values: config.colors.map((c, i) => ({
        id: `${slug}-color-${i}`,
        label: c.name,
        hexColor: c.hex,
        sortOrder: i + 1,
      })),
    });
  }
  if (config.shades) {
    options.push({
      id: "shade",
      name: "Shade",
      displayType: "PILL",
      values: config.shades.map((label, i) => ({
        id: `${slug}-shade-${i}`,
        label,
        hexColor: null,
        sortOrder: i + 1,
      })),
    });
  }
  if (config.sizes) {
    const scale = config.sizes === "apparel" ? APPAREL_SIZES : SHOE_SIZES;
    options.push({
      id: "size",
      name: "Size",
      displayType: "PILL",
      values: scale.map((label, i) => ({
        id: `size-${label.toLowerCase()}`,
        label,
        hexColor: null,
        sortOrder: i + 1,
      })),
    });
  }

  // Every combination of option values becomes a variant, like the
  // ProductVariant × ProductVariantOption join in the schema.
  const axes = options.map((g) => g.values);
  const combos: string[][] =
    axes.length === 0
      ? [[]]
      : axes.reduce<string[][]>(
          (acc, values) =>
            acc.flatMap((combo) => values.map((v) => [...combo, v.id])),
          [[]]
        );

  const sizeCount = axes.length > 0 ? axes[axes.length - 1].length : 1;
  const variants: ProductVariantInfo[] = combos.map((optionValueIds, i) => {
    const sizeIdx = i % sizeCount;
    const price =
      base.maxPrice > base.minPrice && config.sizes
        ? base.minPrice +
          Math.round(
            ((base.maxPrice - base.minPrice) * sizeIdx) / (sizeCount - 1)
          )
        : base.minPrice;
    const stockSeed = hashOf(slug + optionValueIds.join("|"));
    return {
      id: `${slug}-v${i}`,
      sku: `FL-${base.id.toUpperCase()}-${i + 1}`,
      price,
      comparePrice: base.comparePrice,
      stock: stockSeed % 7 === 0 ? 0 : (stockSeed % 12) + 2,
      optionValueIds,
    };
  });

  // Colour-scoped gallery (ProductImage.optionValueId): the product's own
  // photo is scoped to the first colour; sibling photos from the same
  // category stand in for the other colours until real shots exist.
  const siblings = mockProducts
    .filter((p) => p.category.slug === base.category.slug && p.id !== base.id)
    .map((p) => p.image)
    .filter((src): src is string => Boolean(src));

  const colorValues = config.colors
    ? options.find((g) => g.id === "color")!.values
    : [];
  const images: ProductImageInfo[] =
    colorValues.length > 0
      ? colorValues.map((value, i) => ({
          src: i === 0 ? base.image! : (siblings[i - 1] ?? base.image!),
          alt: `${base.title} — ${value.label}`,
          optionValueId: value.id,
        }))
      : [
          { src: base.image!, alt: base.title, optionValueId: null },
          ...siblings.slice(0, 2).map((src, i) => ({
            src,
            alt: `${base.title} — view ${i + 2}`,
            optionValueId: null,
          })),
        ];

  return {
    ...withDerived(base),
    description: config.description,
    specifications: config.specifications,
    options,
    variants,
    images,
    reviews: reviewsFor(slug),
    lowStockThreshold: 5,
  };
}
