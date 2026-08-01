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
 * Admin product management (`/admin/products` + `/admin/catalog`, bearer).
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
// Products
// ---------------------------------------------------------------------------

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
  categoryId?: string;
}

export async function listAdminProducts(
  params: ProductListParams = {},
): Promise<Paginated<AdminProductListItem>> {
  const qs = new URLSearchParams();
  qs.set("limit", String(params.limit ?? 20));
  if (params.page) qs.set("page", String(params.page));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.categoryId) qs.set("categoryId", params.categoryId);
  return apiFetch<Paginated<AdminProductListItem>>(
    `/admin/products?${qs.toString()}`,
  );
}

/** Every product, page-looped (backend caps limit at 100 per page). */
export async function listAllAdminProducts(): Promise<AdminProductListItem[]> {
  const all: AdminProductListItem[] = [];
  let page = 1;
  for (;;) {
    const { items, meta } = await listAdminProducts({ limit: 100, page });
    all.push(...items);
    if (!meta.hasNext) break;
    page += 1;
  }
  return all;
}

export async function getAdminProduct(
  id: string,
): Promise<AdminProductDetail> {
  return mapDetail(await apiFetch<ApiProductDetail>(`/admin/products/${id}`));
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

/** Creates a DRAFT; variants and images are attached to the returned id. */
export async function createProduct(
  payload: ProductPayload & { name: string; categoryId: string },
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/admin/products", {
    method: "POST",
    body: payload,
  });
}

export async function updateProduct(
  id: string,
  payload: ProductPayload,
): Promise<void> {
  await apiFetch(`/admin/products/${id}`, { method: "PATCH", body: payload });
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/admin/products/${id}`, { method: "DELETE" });
}

/** Admin-only route — sellers go through POST /:id/submit instead. */
export async function setProductStatus(
  id: string,
  status: Exclude<ProductStatus, "OUT_OF_STOCK" | "PENDING_APPROVAL">,
  rejectionReason?: string,
): Promise<void> {
  await apiFetch(`/admin/products/${id}/status`, {
    method: "PATCH",
    body: { status, ...(rejectionReason && { rejectionReason }) },
  });
}

// ---------------------------------------------------------------------------
// Options & variants
// ---------------------------------------------------------------------------

/** Replaces the product's option set. 409s once variants exist. */
export async function attachProductOptions(
  productId: string,
  optionIds: string[],
): Promise<AdminProductOption[]> {
  const raw = await apiFetch<ApiProductOption[]>(
    `/admin/products/${productId}/options`,
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
}

export interface GenerateSelection {
  optionId: string;
  valueIds: string[];
}

/** Builds the matrix; existing combinations are skipped, not duplicated. */
export async function generateVariants(
  productId: string,
  input: {
    selections: GenerateSelection[];
    price: number;
    stock: number;
    skuPrefix?: string;
  },
): Promise<{ created: number; skipped: number; total: number }> {
  return apiFetch(`/admin/products/${productId}/variants/generate`, {
    method: "POST",
    body: input,
  });
}

export async function getProductVariants(
  productId: string,
): Promise<AdminProductVariant[]> {
  const raw = await apiFetch<ApiVariant[]>(
    `/admin/products/${productId}/variants`,
  );
  return raw.map(stripVariant);
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

export async function updateVariant(
  variantId: string,
  payload: VariantPayload,
): Promise<AdminProductVariant> {
  return apiFetch<AdminProductVariant>(
    `/admin/catalog/variants/${variantId}`,
    { method: "PATCH", body: payload },
  );
}

export async function deleteVariant(variantId: string): Promise<void> {
  await apiFetch(`/admin/catalog/variants/${variantId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export async function getProductImages(
  productId: string,
): Promise<AdminProductImage[]> {
  return apiFetch<AdminProductImage[]>(`/admin/products/${productId}/images`);
}

/** `optionValueId` scopes the photo to a colour the product actually uses. */
export async function addProductImage(
  productId: string,
  body: {
    url: string;
    publicId?: string;
    alt?: string;
    optionValueId?: string;
    isPrimary?: boolean;
  },
): Promise<AdminProductImage> {
  return apiFetch<AdminProductImage>(`/admin/products/${productId}/images`, {
    method: "POST",
    body,
  });
}

export async function setPrimaryImage(imageId: string): Promise<void> {
  await apiFetch(`/admin/catalog/images/${imageId}/primary`, {
    method: "PATCH",
  });
}

export async function deleteProductImage(imageId: string): Promise<void> {
  await apiFetch(`/admin/catalog/images/${imageId}`, { method: "DELETE" });
}
