/**
 * Storefront-facing shapes, mirroring what the API will return.
 * Field names follow `prisma/schema.prisma` (see FEATURE.md) — e.g. products
 * carry the denormalised `minPrice` / `avgRating` / `soldCount` fields, and
 * sellers are never exposed.
 */

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  productCount: number;
}

export interface FlashSaleInfo {
  /** Resolved sale price for the cheapest variant. */
  flashPrice: number;
  quantityLimit: number | null;
  soldCount: number;
}

export interface ProductListItem {
  id: string;
  slug: string;
  title: string;
  category: { name: string; slug: string };
  image: string | null;
  /** Selling price range across variants (denormalised on Product). */
  minPrice: number;
  maxPrice: number;
  /** Strike-through "was" price, when set. */
  comparePrice: number | null;
  avgRating: number;
  reviewCount: number;
  soldCount: number;
  totalStock: number;
  isFeatured: boolean;
  publishedAt: string;
  /** Published within the last few days — derived in the data layer. */
  isNew: boolean;
  flashSale?: FlashSaleInfo | null;
}

export interface HomeBanner {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  ctaLabel: string;
  href: string;
  image: string | null;
  /** Descriptive alt/caption for the primary image (frontend-only for now). */
  imageAlt?: string | null;
  /** Extra artwork for editorial hero collages (frontend-only for now). */
  supportingImages?: { src: string; alt: string }[];
}

export interface HomeData {
  banner: HomeBanner;
  categories: CategorySummary[];
  flashSale: {
    title: string;
    endsAt: string;
    items: ProductListItem[];
  } | null;
  featured: ProductListItem[];
  newArrivals: ProductListItem[];
  bestSellers: ProductListItem[];
}
