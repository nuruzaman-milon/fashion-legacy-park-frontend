import { createCatalogApi } from "@/lib/api/catalog";

/**
 * Seller product management (`/seller/products` + `/seller/catalog`, SELLER
 * bearer) — the seller-bound instance of the shared catalog client. Same
 * router server-side as the admin one, scoped to the caller's own products.
 * Sellers have no status PATCH: they go DRAFT → submit → admin review.
 */
export const sellerCatalogApi = createCatalogApi("seller");
