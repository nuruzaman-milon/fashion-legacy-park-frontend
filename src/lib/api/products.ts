import type {
  CategorySummary,
  CategoryTreeNode,
  ProductDetail,
  ProductListItem,
  ProductVariantInfo,
} from "@/types/catalog";

import { publicApiFetch } from "./server";

/**
 * Product data-access layer, wired to the backend endpoints documented in
 * API-HOMEPAGE.md (§3 categories, §6 listing/search, §7 detail).
 */

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Backend page size cap — also covers the whole seed catalogue in one page. */
const LISTING_LIMIT = 100;

/** Raw `GET /products` list item — note `name` not title, Decimals as strings. */
export interface ApiProductListItem {
  id: string;
  name: string;
  slug: string;
  minPrice: string;
  maxPrice: string;
  comparePrice: string | null;
  totalStock: number;
  avgRating: number;
  reviewCount: number;
  soldCount: number;
  isFeatured: boolean;
  status: string;
  publishedAt: string;
  category: { id: string; name: string; slug: string };
  images: { url: string; alt: string | null }[];
}

interface ApiProductListPayload {
  items: ApiProductListItem[];
  meta: { total: number };
}

export function mapApiProduct(p: ApiProductListItem): ProductListItem {
  return {
    id: p.id,
    slug: p.slug,
    title: p.name,
    category: { name: p.category.name, slug: p.category.slug },
    image: p.images[0]?.url ?? null,
    minPrice: Number(p.minPrice),
    maxPrice: Number(p.maxPrice),
    comparePrice: p.comparePrice === null ? null : Number(p.comparePrice),
    avgRating: p.avgRating,
    reviewCount: p.reviewCount,
    soldCount: p.soldCount,
    totalStock: p.totalStock,
    isFeatured: p.isFeatured,
    publishedAt: p.publishedAt,
    isNew: Date.now() - new Date(p.publishedAt).getTime() < NEW_WINDOW_MS,
    flashSale: null,
  };
}

export async function getCategories(): Promise<CategorySummary[]> {
  try {
    const tree = await publicApiFetch<CategoryTreeNode[]>("/categories/tree");
    return tree.map(({ id, name, slug, image, productCount }) => ({
      id,
      name,
      slug,
      image,
      productCount,
    }));
  } catch {
    return [];
  }
}

/** Single category by slug — any depth, unlike the root-only getCategories. */
export async function getCategory(
  slug: string,
): Promise<CategorySummary | null> {
  try {
    const c = await publicApiFetch<{
      id: string;
      name: string;
      slug: string;
      image: string | null;
    }>(`/categories/${encodeURIComponent(slug)}`);
    return { id: c.id, name: c.name, slug: c.slug, image: c.image, productCount: 0 };
  } catch {
    return null;
  }
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

export async function getProducts(
  query: ProductListQuery = {},
): Promise<{ products: ProductListItem[]; total: number }> {
  const params = new URLSearchParams();
  // `categorySlug` matches the whole subtree, so a root slug from the nav
  // returns everything under it (API-HOMEPAGE.md §6).
  if (query.category) params.set("categorySlug", query.category);
  if (query.minPrice !== undefined) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) params.set("maxPrice", String(query.maxPrice));
  const sort = query.sort ?? "featured";
  if (sort !== "featured") params.set("sort", sort);
  params.set("limit", String(LISTING_LIMIT));

  let items: ApiProductListItem[];
  try {
    ({ items } = await publicApiFetch<ApiProductListPayload>(
      `/products?${params}`,
      { revalidate: 60 },
    ));
  } catch {
    return { products: [], total: 0 };
  }

  // The backend has no rating / on-sale filters and no "featured" sort —
  // applied here over the fetched page, which holds the whole catalogue
  // while it stays under LISTING_LIMIT.
  let products = items.map(mapApiProduct);
  if (query.rating !== undefined) {
    products = products.filter((p) => p.avgRating >= query.rating!);
  }
  if (query.onSale) {
    products = products.filter(
      (p) => p.comparePrice !== null && p.comparePrice > p.minPrice,
    );
  }
  if (sort === "featured") {
    products.sort(
      (a, b) =>
        Number(b.isFeatured) - Number(a.isFeatured) ||
        b.soldCount - a.soldCount,
    );
  }

  return { products, total: products.length };
}

export async function searchProducts(
  term: string,
): Promise<{ products: ProductListItem[]; total: number }> {
  const q = term.trim();
  if (!q) return { products: [], total: 0 };
  try {
    const { items, meta } = await publicApiFetch<ApiProductListPayload>(
      `/products?search=${encodeURIComponent(q)}&limit=${LISTING_LIMIT}`,
      { revalidate: 60 },
    );
    return { products: items.map(mapApiProduct), total: meta.total };
  } catch {
    return { products: [], total: 0 };
  }
}

/* ------------------------------------------------------------------ */
/* Product detail — API-HOMEPAGE.md §7                                 */
/* ------------------------------------------------------------------ */

/** Raw `GET /products/:slug` payload — list fields plus the picker data. */
interface ApiProductDetail extends ApiProductListItem {
  shortDescription: string | null;
  description: string | null;
  specifications: Record<string, string> | null;
  images: { url: string; alt: string | null; optionValueId: string | null }[];
  productOptions: {
    option: {
      id: string;
      name: string;
      displayType: "SWATCH" | "BUTTON" | "DROPDOWN";
      values: {
        id: string;
        value: string;
        hexColor: string | null;
        sortOrder: number;
      }[];
    };
  }[];
  variants: {
    id: string;
    sku: string;
    price: string;
    comparePrice: string | null;
    /** stock − reservedStock — what can actually be bought right now. */
    available: number;
    isDefault: boolean;
    valueIds: string[];
    flash: {
      price: string;
      quantityLimit: number | null;
      soldCount: number;
      remaining: number | null;
    } | null;
  }[];
  inStockValueIds: string[];
  flashSale: { id: string; title: string; endsAt: string } | null;
}

export async function getAllProductSlugs(): Promise<string[]> {
  try {
    const { items } = await publicApiFetch<ApiProductListPayload>(
      `/products?limit=${LISTING_LIMIT}`,
    );
    return items.map((p) => p.slug);
  } catch {
    return []; // nothing prerendered — detail pages render on demand
  }
}

export async function getRelatedProducts(
  categorySlug: string,
  excludeId: string,
): Promise<ProductListItem[]> {
  try {
    const { items } = await publicApiFetch<ApiProductListPayload>(
      `/products?categorySlug=${encodeURIComponent(categorySlug)}&limit=9`,
      { revalidate: 60 },
    );
    return items.filter((p) => p.id !== excludeId).map(mapApiProduct);
  } catch {
    return [];
  }
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  let api: ApiProductDetail;
  try {
    api = await publicApiFetch<ApiProductDetail>(
      `/products/${encodeURIComponent(slug)}`,
      { revalidate: 60 },
    );
  } catch {
    return null; // unknown slug or backend down — both render not-found
  }

  // Default variant first, so the page's pre-selection fallback shows the
  // price the backend chose as the listing price.
  const variants: ProductVariantInfo[] = [...api.variants]
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      price: Number(v.price),
      comparePrice: v.comparePrice === null ? null : Number(v.comparePrice),
      stock: v.available,
      optionValueIds: v.valueIds,
      flash: v.flash && {
        price: Number(v.flash.price),
        quantityLimit: v.flash.quantityLimit,
        soldCount: v.flash.soldCount,
        remaining: v.flash.remaining,
      },
    }));
  if (variants.length === 0) return null; // never live per backend rules

  return {
    ...mapApiProduct(api),
    shortDescription: api.shortDescription,
    description: api.description ?? "",
    specifications: api.specifications ?? {},
    options: api.productOptions
      .map(({ option }) => ({
        id: option.id,
        name: option.name,
        // BUTTON and DROPDOWN both render as pills — a dropdown for four
        // sizes is worse UX than the pills the design already has.
        displayType:
          option.displayType === "SWATCH" ? ("SWATCH" as const) : ("PILL" as const),
        values: option.values.map((v) => ({
          id: v.id,
          label: v.value,
          hexColor: v.hexColor,
          sortOrder: v.sortOrder,
        })),
      }))
      .filter((group) => group.values.length > 0),
    variants,
    images: api.images.map((img) => ({
      src: img.url,
      alt: img.alt ?? api.name,
      optionValueId: img.optionValueId,
    })),
    inStockValueIds: api.inStockValueIds,
    // The reviews module isn't built yet — `avgRating`/`reviewCount` are
    // real, individual review rows don't exist.
    reviews: [],
    lowStockThreshold: 5,
  };
}
