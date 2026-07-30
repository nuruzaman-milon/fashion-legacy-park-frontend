import { apiFetch } from "@/lib/api/client";
import type { Paginated } from "@/types/admin";

export interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

/** One page covers any realistic brand list (backend caps limit at 100). */
export async function getAdminBrands(): Promise<AdminBrand[]> {
  const { items } = await apiFetch<Paginated<AdminBrand>>(
    "/admin/brands?limit=100",
  );
  return items;
}
