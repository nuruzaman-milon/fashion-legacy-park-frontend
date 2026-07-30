import { apiFetch } from "@/lib/api/client";
import type { Paginated } from "@/types/admin";

/**
 * Brand CRUD (`/admin/brands`, bearer). Deleting a brand does NOT block on
 * products — their `brandId` becomes null and they keep selling unbranded,
 * so the confirm dialog warns instead of refusing.
 */

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  logoPublicId: string | null;
  sortOrder: number;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { products: number };
}

/** One page covers any realistic brand list (backend caps limit at 100). */
export async function getAdminBrands(): Promise<AdminBrand[]> {
  const { items } = await apiFetch<Paginated<AdminBrand>>(
    "/admin/brands?limit=100&sortBy=sortOrder&sortOrder=asc",
  );
  return items;
}

/** Optional string fields are `null` to clear; omit `slug` to generate. */
export interface BrandPayload {
  name?: string;
  slug?: string;
  description?: string | null;
  logo?: string | null;
  logoPublicId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
}

export async function createBrand(
  payload: BrandPayload & { name: string },
): Promise<AdminBrand> {
  return apiFetch<AdminBrand>("/admin/brands", {
    method: "POST",
    body: payload,
  });
}

export async function updateBrand(
  id: string,
  payload: BrandPayload,
): Promise<AdminBrand> {
  return apiFetch<AdminBrand>(`/admin/brands/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteBrand(id: string): Promise<void> {
  await apiFetch(`/admin/brands/${id}`, { method: "DELETE" });
}
