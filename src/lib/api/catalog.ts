import { apiFetch } from "@/lib/api/client";
import type {
  AdminProductDetail,
  AdminProductImage,
  AdminProductListItem,
  AdminProductOption,
  AdminProductVariant,
  Paginated,
  ProductStatus,
} from "@/types/admin";

/**
 * Product-management client factory. The backend mounts ONE router at both
 * `/admin/products` and `/seller/products` (scoping by the caller's role),
 * so the same functions serve both surfaces — only the path prefix differs.
 * `lib/api/admin/products.ts` and `lib/api/seller/products.ts` are the two
 * bound instances.
 *
 * The API nests options as `productOptions[].option.values[]` and variants
 * with their `variantOptions` — mappers below flatten both to the UI shapes.
 */

// ---------------------------------------------------------------------------
// Raw API fragments that need flattening
// ---------------------------------------------------------------------------

interface ApiProductOption {
  id: string;
  optionId: string;
  sortOrder: number;
  option: {
    id: string;
    name: string;
    displayType: "DROPDOWN" | "SWATCH" | "BUTTON";
    values: {
      id: string;
      value: string;
      hexColor: string | null;
      sortOrder: number;
      isActive: boolean;
    }[];
  };
}

type ApiVariant = AdminProductVariant & {
  variantOptions?: { valueId: string }[];
};

type ApiProductDetail = Omit<
  AdminProductDetail,
  "options" | "variants" | "tags" | "specifications"
> & {
  productOptions: ApiProductOption[];
  variants: ApiVariant[];
  tags: string[] | null;
  specifications: Record<string, string> | null;
};

export function mapOptions(raw: ApiProductOption[]): AdminProductOption[] {
  return raw.map((po) => ({
    id: po.id,
    optionId: po.optionId,
    name: po.option.name,
    displayType: po.option.displayType,
    sortOrder: po.sortOrder,
    values: po.option.values
      .filter((v) => v.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((v) => ({
        id: v.id,
        value: v.value,
        hexColor: v.hexColor,
        sortOrder: v.sortOrder,
      })),
  }));
}

function stripVariant(raw: ApiVariant): AdminProductVariant {
  const variant = { ...raw };
  delete variant.variantOptions;
  return variant;
}

function mapDetail(raw: ApiProductDetail): AdminProductDetail {
  const { productOptions, variants, ...rest } = raw;
  return {
    ...rest,
    tags: raw.tags ?? [],
    specifications: raw.specifications ?? null,
    options: mapOptions(productOptions),
    variants: variants.map(stripVariant),
  };
}

// ---------------------------------------------------------------------------
// Shared payload shapes
// ---------------------------------------------------------------------------

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
  categoryId?: string;
}

export interface ProductPayload {
  name?: string;
  slug?: string;
  shortDescription?: string | null;
  description?: string | null;
  videoUrl?: string | null;
  /** Key-value rows rendered as the Specifications table on the storefront. */
  specifications?: Record<string, string> | null;
  tags?: string[];
  categoryId?: string;
  brandId?: string | null;
  isFeatured?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
}

export interface GenerateSelection {
  optionId: string;
  valueIds: string[];
}

export interface VariantPayload {
  sku?: string;
  barcode?: string | null;
  price?: number;
  comparePrice?: number | null;
  costPrice?: number | null;
  stock?: number;
  lowStockThreshold?: number;
  weight?: number | null;
  sortOrder?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface CatalogApi {
  listProducts: (
    params?: ProductListParams,
  ) => Promise<Paginated<AdminProductListItem>>;
  /** Every product, page-looped (backend caps limit at 100 per page). */
  listAllProducts: () => Promise<AdminProductListItem[]>;
  getProduct: (id: string) => Promise<AdminProductDetail>;
  /** Creates a DRAFT; variants and images are attached to the returned id. */
  createProduct: (
    payload: ProductPayload & { name: string; categoryId: string },
  ) => Promise<{ id: string }>;
  updateProduct: (id: string, payload: ProductPayload) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  /** DRAFT/REJECTED → PENDING_APPROVAL. Needs ≥1 active variant. */
  submitProduct: (id: string) => Promise<void>;
  /** Replaces the product's option set. 409s once variants exist. */
  attachProductOptions: (
    productId: string,
    optionIds: string[],
  ) => Promise<AdminProductOption[]>;
  /** Builds the matrix; existing combinations are skipped, not duplicated. */
  generateVariants: (
    productId: string,
    input: {
      selections: GenerateSelection[];
      price: number;
      stock: number;
      skuPrefix?: string;
    },
  ) => Promise<{ created: number; skipped: number; total: number }>;
  getProductVariants: (productId: string) => Promise<AdminProductVariant[]>;
  updateVariant: (
    variantId: string,
    payload: VariantPayload,
  ) => Promise<AdminProductVariant>;
  deleteVariant: (variantId: string) => Promise<void>;
  getProductImages: (productId: string) => Promise<AdminProductImage[]>;
  /** `optionValueId` scopes the photo to a colour the product actually uses. */
  addProductImage: (
    productId: string,
    body: {
      url: string;
      publicId?: string;
      alt?: string;
      optionValueId?: string;
      isPrimary?: boolean;
    },
  ) => Promise<AdminProductImage>;
  setPrimaryImage: (imageId: string) => Promise<void>;
  deleteProductImage: (imageId: string) => Promise<void>;
}

export function createCatalogApi(base: "admin" | "seller"): CatalogApi {
  const products = `/${base}/products`;
  const catalog = `/${base}/catalog`;

  const listProducts = async (
    params: ProductListParams = {},
  ): Promise<Paginated<AdminProductListItem>> => {
    const qs = new URLSearchParams();
    qs.set("limit", String(params.limit ?? 20));
    if (params.page) qs.set("page", String(params.page));
    if (params.search) qs.set("search", params.search);
    if (params.status) qs.set("status", params.status);
    if (params.categoryId) qs.set("categoryId", params.categoryId);
    return apiFetch<Paginated<AdminProductListItem>>(
      `${products}?${qs.toString()}`,
    );
  };

  return {
    listProducts,

    listAllProducts: async () => {
      const all: AdminProductListItem[] = [];
      let page = 1;
      for (;;) {
        const { items, meta } = await listProducts({ limit: 100, page });
        all.push(...items);
        if (!meta.hasNext) break;
        page += 1;
      }
      return all;
    },

    getProduct: async (id) =>
      mapDetail(await apiFetch<ApiProductDetail>(`${products}/${id}`)),

    createProduct: async (payload) =>
      apiFetch<{ id: string }>(products, { method: "POST", body: payload }),

    updateProduct: async (id, payload) => {
      await apiFetch(`${products}/${id}`, { method: "PATCH", body: payload });
    },

    deleteProduct: async (id) => {
      await apiFetch(`${products}/${id}`, { method: "DELETE" });
    },

    submitProduct: async (id) => {
      await apiFetch(`${products}/${id}/submit`, { method: "POST" });
    },

    attachProductOptions: async (productId, optionIds) => {
      const raw = await apiFetch<ApiProductOption[]>(
        `${products}/${productId}/options`,
        {
          method: "POST",
          body: {
            options: optionIds.map((optionId, index) => ({
              optionId,
              sortOrder: index,
            })),
          },
        },
      );
      return mapOptions(raw);
    },

    generateVariants: async (productId, input) =>
      apiFetch(`${products}/${productId}/variants/generate`, {
        method: "POST",
        body: input,
      }),

    getProductVariants: async (productId) => {
      const raw = await apiFetch<ApiVariant[]>(
        `${products}/${productId}/variants`,
      );
      return raw.map(stripVariant);
    },

    updateVariant: async (variantId, payload) =>
      apiFetch<AdminProductVariant>(`${catalog}/variants/${variantId}`, {
        method: "PATCH",
        body: payload,
      }),

    deleteVariant: async (variantId) => {
      await apiFetch(`${catalog}/variants/${variantId}`, { method: "DELETE" });
    },

    getProductImages: async (productId) =>
      apiFetch<AdminProductImage[]>(`${products}/${productId}/images`),

    addProductImage: async (productId, body) =>
      apiFetch<AdminProductImage>(`${products}/${productId}/images`, {
        method: "POST",
        body,
      }),

    setPrimaryImage: async (imageId) => {
      await apiFetch(`${catalog}/images/${imageId}/primary`, {
        method: "PATCH",
      });
    },

    deleteProductImage: async (imageId) => {
      await apiFetch(`${catalog}/images/${imageId}`, { method: "DELETE" });
    },
  };
}
