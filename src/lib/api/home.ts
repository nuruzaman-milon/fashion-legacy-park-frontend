import type {
  CategorySummary,
  CategoryTreeNode,
  HomeBanner,
  HomeData,
  ProductListItem,
} from "@/types/catalog";

import {
  mapApiProduct,
  type ApiProductListItem,
} from "./products";
import { publicApiFetch } from "./server";

/**
 * Homepage data, assembled from the endpoints in API-HOMEPAGE.md: banners,
 * the category tree (roots → category strip), the active flash sale and the
 * product rails. All fetches run in parallel and every section degrades
 * gracefully — a failed call renders as an empty/hidden section, never a
 * crashed page.
 */

const RAIL_LIMIT = 8;

/** Shown until a banner is created via the admin panel (table is empty). */
const FALLBACK_BANNER: HomeBanner = {
  id: "banner-static-winter",
  eyebrow: "Winter Collection · 2026",
  title: "This winter, wear your legacy",
  subtitle:
    "Sherpa-lined corduroy, brushed flannel and heavyweight fleece — cut for cold mornings and made to outlast the season.",
  ctaLabel: "Shop winter collection",
  href: "/products?collection=winter-2026",
  image: "/images/winter-collections/premium-jacket.jpeg",
  imageAlt: "Sherpa-lined corduroy jacket in charcoal",
  supportingImages: [
    {
      src: "/images/winter-collections/jacket.jpeg",
      alt: "Quarter-zip fleece pullover in taupe",
    },
    {
      src: "/images/winter-collections/mens-shirt.jpeg",
      alt: "Brushed flannel shirt in dark plaid",
    },
  ],
};

interface ApiBanner {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  desktopImageUrl: string | null;
  imageAlt: string | null;
  supportingImages: { src: string; alt: string; href?: string | null }[] | null;
  buttonText: string;
  buttonLink: string;
}

interface ApiFlashSale {
  title: string;
  endsAt: string;
  items: {
    price: string;
    comparePrice: string | null;
    flashPrice: string;
    quantityLimit: number | null;
    soldCount: number;
    available: number;
    product: {
      id: string;
      name: string;
      slug: string;
      avgRating: number;
      reviewCount: number;
      images: { url: string; alt: string | null }[];
    };
  }[];
}

/** The hero keeps the static banner until one is created in the admin panel. */
async function getBanner(): Promise<HomeBanner> {
  try {
    const banners = await publicApiFetch<ApiBanner[]>("/banners");
    const b = banners[0];
    if (!b) return FALLBACK_BANNER;
    return {
      id: b.id,
      eyebrow: b.eyebrow,
      title: b.title,
      subtitle: b.subtitle,
      ctaLabel: b.buttonText,
      href: b.buttonLink,
      image: b.desktopImageUrl,
      imageAlt: b.imageAlt,
      supportingImages: b.supportingImages ?? [],
    };
  } catch {
    return FALLBACK_BANNER;
  }
}

interface ApiFeaturedCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  rootName: string | null;
  productCount: number;
}

/**
 * Admin-curated "Shop by category" tiles (`GET /categories/featured`) —
 * sub-categories the roots in the navbar don't already cover. Falls back to
 * the root tree until an admin has curated anything.
 */
async function getCategoryStrip(): Promise<CategorySummary[]> {
  try {
    const featured = await publicApiFetch<ApiFeaturedCategory[]>(
      "/categories/featured",
    );
    if (featured.length > 0) {
      return featured.map(({ id, name, slug, image, rootName, productCount }) => ({
        id,
        name,
        slug,
        image,
        rootName,
        productCount,
      }));
    }
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

async function getFlashSale(): Promise<HomeData["flashSale"]> {
  try {
    // `data` is null (still HTTP 200) when no sale is live — section hidden.
    const sale = await publicApiFetch<ApiFlashSale | null>(
      "/flash-sales/active",
      { revalidate: 60 },
    );
    if (!sale) return null;
    const items: ProductListItem[] = sale.items.map((item) => ({
      id: item.product.id,
      slug: item.product.slug,
      title: item.product.name,
      // The flash-sale payload carries no category — the card hides the label.
      category: { name: "", slug: "" },
      image: item.product.images[0]?.url ?? null,
      minPrice: Number(item.price),
      maxPrice: Number(item.price),
      comparePrice:
        item.comparePrice === null ? null : Number(item.comparePrice),
      avgRating: item.product.avgRating,
      reviewCount: item.product.reviewCount,
      soldCount: item.soldCount,
      totalStock: item.available,
      isFeatured: false,
      publishedAt: "",
      isNew: false,
      flashSale: {
        flashPrice: Number(item.flashPrice),
        quantityLimit: item.quantityLimit,
        soldCount: item.soldCount,
      },
    }));
    return { title: sale.title, endsAt: sale.endsAt, items };
  } catch {
    return null;
  }
}

async function getRail(query: string): Promise<ProductListItem[]> {
  try {
    const { items } = await publicApiFetch<{ items: ApiProductListItem[] }>(
      `/products?${query}&limit=${RAIL_LIMIT}`,
    );
    return items.map(mapApiProduct);
  } catch {
    return [];
  }
}

export async function getHomeData(): Promise<HomeData> {
  const [banner, categories, flashSale, newArrivals, bestSellers] =
    await Promise.all([
      getBanner(),
      getCategoryStrip(),
      getFlashSale(),
      getRail("sort=newest"),
      getRail("sort=best-selling"),
    ]);

  return { banner, categories, flashSale, newArrivals, bestSellers };
}
