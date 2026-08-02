import { apiFetch } from "@/lib/api/client";
import { createCatalogApi, mapOptions } from "@/lib/api/catalog";
import type { ProductStatus } from "@/types/admin";

/**
 * Admin product management (`/admin/products` + `/admin/catalog`, bearer) —
 * the admin-bound instance of the shared catalog client, plus the one route
 * only admins have. See `lib/api/catalog.ts` for the implementation.
 */

export const adminCatalogApi = createCatalogApi("admin");

export const {
  listProducts: listAdminProducts,
  listAllProducts: listAllAdminProducts,
  getProduct: getAdminProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  attachProductOptions,
  generateVariants,
  getProductVariants,
  updateVariant,
  deleteVariant,
  getProductImages,
  addProductImage,
  setPrimaryImage,
  deleteProductImage,
} = adminCatalogApi;

export { mapOptions };
export type {
  GenerateSelection,
  ProductListParams,
  ProductPayload,
  VariantPayload,
} from "@/lib/api/catalog";

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
