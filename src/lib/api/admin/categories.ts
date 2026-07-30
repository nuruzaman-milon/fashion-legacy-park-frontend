import { apiFetch } from "@/lib/api/client";
import type { AdminCategory, Paginated } from "@/types/admin";

/**
 * Admin category CRUD (`/admin/categories`, ADMIN/SUPER_ADMIN bearer).
 * Everything here is client-side: the access token lives in the token store,
 * so these are called from client components only.
 */

/** Backend hard-caps limit at 100; pages are looped so the tree is complete. */
const PAGE_LIMIT = 100;

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const all: AdminCategory[] = [];
  let page = 1;
  for (;;) {
    const { items, meta } = await apiFetch<Paginated<AdminCategory>>(
      `/admin/categories?limit=${PAGE_LIMIT}&page=${page}`,
    );
    all.push(...items);
    if (!meta.hasNext) break;
    page += 1;
  }
  return all;
}

/**
 * Create/update body — everything optional so PATCH can send only what
 * changed (image fields in particular: omitting them preserves the stored
 * publicIds). `null` clears a field; omitting `slug` on create lets the
 * backend generate it from the name.
 */
export interface CategoryPayload {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  showOnHome?: boolean;
  homeSortOrder?: number;
  icon?: string | null;
  iconPublicId?: string | null;
  image?: string | null;
  imagePublicId?: string | null;
  banner?: string | null;
  bannerPublicId?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
}

export async function createCategory(
  payload: CategoryPayload & { name: string },
): Promise<AdminCategory> {
  return apiFetch<AdminCategory>("/admin/categories", {
    method: "POST",
    body: payload,
  });
}

export async function updateCategory(
  id: string,
  payload: CategoryPayload,
): Promise<AdminCategory> {
  return apiFetch<AdminCategory>(`/admin/categories/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

/** 409s (with a human message) while the category has children or products. */
export async function deleteCategory(id: string): Promise<void> {
  await apiFetch(`/admin/categories/${id}`, { method: "DELETE" });
}

/**
 * "Women › Clothing › Sarees" — full ancestor path, because every root has a
 * "Clothing" child and the bare leaf name is ambiguous in pickers.
 */
export function categoryPathLabel(
  category: AdminCategory,
  all: AdminCategory[],
): string {
  const parts = [category.name];
  let cursor = category;
  while (cursor.parentId) {
    const parent = all.find((p) => p.id === cursor.parentId);
    if (!parent) break;
    parts.unshift(parent.name);
    cursor = parent;
  }
  return parts.join(" › ");
}
