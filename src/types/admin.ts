/**
 * Admin-panel shapes, mirroring the backend's admin endpoints (docs/admin.md,
 * docs/catalog.md). Prisma `Decimal` fields serialize to JSON *strings* —
 * price fields here are strings; parse with `Number()` before arithmetic.
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export type ProductStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "INACTIVE"
  | "REJECTED"
  | "OUT_OF_STOCK";

/** One row of `GET /admin/categories` — flat; the tree is built from parentId. */
export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  banner: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  showOnHome: boolean;
  homeSortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { children: number; products: number };
}

/** Mirrors `ProductVariant` on the admin endpoints. */
export interface AdminProductVariant {
  id: string;
  /** Generated label, e.g. "Red / M". */
  name: string;
  sku: string;
  barcode: string | null;
  price: string;
  comparePrice: string | null;
  costPrice: string | null;
  stock: number;
  reservedStock: number;
  lowStockThreshold: number;
  weight: string | null;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
}

export interface AdminProductImage {
  id: string;
  url: string;
  publicId: string | null;
  alt: string | null;
  /** Scopes the image to a colour value, not a variant. */
  optionValueId: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface AdminProductOptionValue {
  id: string;
  value: string;
  hexColor: string | null;
  sortOrder: number;
}

/** A row of `productOptions` — the option attached to this product. */
export interface AdminProductOption {
  id: string;
  optionId: string;
  name: string;
  displayType: "DROPDOWN" | "SWATCH" | "BUTTON";
  sortOrder: number;
  values: AdminProductOptionValue[];
}

/** One row of `GET /admin/products`. */
export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  isFeatured: boolean;
  /** Prisma Decimal → string; null until the product has variants. */
  minPrice: string | null;
  maxPrice: string | null;
  totalStock: number;
  soldCount: number;
  avgRating: number;
  reviewCount: number;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string } | null;
  seller: { id: string; shopName: string; code: string } | null;
  images: { id: string; url: string; alt: string | null; isPrimary: boolean }[];
  _count: { variants: number; images: number };
  createdAt: string;
  updatedAt: string;
}

/** `GET /admin/products/:id` — the list row plus everything editable. */
export interface AdminProductDetail extends AdminProductListItem {
  shortDescription: string | null;
  description: string | null;
  videoUrl: string | null;
  specifications: Record<string, string> | null;
  tags: string[];
  rejectionReason: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  options: AdminProductOption[];
  variants: AdminProductVariant[];
  images: AdminProductImage[];
}
