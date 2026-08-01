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
  /**
   * Top-level ancestor ("Women", "Men", …) for curated homepage tiles —
   * disambiguates same-named leaves. Absent/null on root categories.
   */
  rootName?: string | null;
}

/** One node of `GET /categories/tree` — active categories only, max 3 levels. */
export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  sortOrder: number;
  productCount: number;
  children: CategoryTreeNode[];
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

/** Mirrors `Option` / `OptionValue` — the global option library. */
export interface ProductOptionValue {
  id: string;
  label: string;
  hexColor: string | null;
  sortOrder: number;
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  displayType: "SWATCH" | "PILL";
  values: ProductOptionValue[];
}

/** Mirrors `ProductVariant` + its `ProductVariantOption` rows. */
export interface ProductVariantInfo {
  id: string;
  sku: string;
  price: number;
  comparePrice: number | null;
  stock: number;
  optionValueIds: string[];
  /** Live flash-sale deal for THIS variant — null when it isn't on sale. */
  flash: {
    price: number;
    quantityLimit: number | null;
    soldCount: number;
    /** Units left at flash price; null = uncapped. */
    remaining: number | null;
  } | null;
}

/** Mirrors `ProductImage` — `optionValueId` scopes an image to a colour. */
export interface ProductImageInfo {
  src: string;
  alt: string;
  optionValueId: string | null;
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
  helpfulCount: number;
  adminReply: string | null;
}

export interface ProductDetail extends ProductListItem {
  /** One-line summary shown under the title; also the SEO meta fallback. */
  shortDescription: string | null;
  description: string;
  /** `Product.specifications` Json — display-only per FEATURE.md. */
  specifications: Record<string, string>;
  options: ProductOptionGroup[];
  variants: ProductVariantInfo[];
  images: ProductImageInfo[];
  /** Option values with purchasable stock — the picker greys out the rest. */
  inStockValueIds: string[];
  reviews: ProductReview[];
  lowStockThreshold: number;
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
  /** Extra artwork for editorial hero collages; `href` makes a tile clickable. */
  supportingImages?: { src: string; alt: string; href?: string | null }[];
}

export interface HomeData {
  banner: HomeBanner;
  categories: CategorySummary[];
  flashSale: {
    title: string;
    endsAt: string;
    items: ProductListItem[];
  } | null;
  newArrivals: ProductListItem[];
  bestSellers: ProductListItem[];
}
