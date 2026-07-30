import { apiFetch } from "@/lib/api/client";
import type { Paginated } from "@/types/admin";

/**
 * Hero banner CRUD (`/admin/banners`, bearer). The storefront homepage shows
 * the first active banner from public `GET /banners` (sorted by sortOrder)
 * and falls back to a static hero while the table is empty.
 */

export interface BannerSupportingImage {
  src: string;
  alt?: string;
  publicId?: string;
  /** Where the hero tile navigates on click — a store path or full URL. */
  href?: string;
}

export interface AdminBanner {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  desktopImageUrl: string;
  mobileImageUrl: string | null;
  imageAlt: string | null;
  desktopImagePublicId: string | null;
  mobileImagePublicId: string | null;
  supportingImages: BannerSupportingImage[] | null;
  buttonText: string | null;
  buttonLink: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** One page covers any realistic banner set (backend caps limit at 100). */
export async function getAdminBanners(): Promise<AdminBanner[]> {
  const { items } = await apiFetch<Paginated<AdminBanner>>(
    "/admin/banners?limit=100&sortBy=sortOrder&sortOrder=asc",
  );
  return items;
}

export async function getAdminBanner(id: string): Promise<AdminBanner> {
  return apiFetch<AdminBanner>(`/admin/banners/${id}`);
}

/**
 * Optional string fields are `null` to clear. `buttonLink` is a plain string
 * on purpose — internal paths like `/products?sale=1` are allowed.
 */
export interface BannerPayload {
  title?: string;
  eyebrow?: string | null;
  subtitle?: string | null;
  desktopImageUrl?: string;
  desktopImagePublicId?: string | null;
  mobileImageUrl?: string | null;
  mobileImagePublicId?: string | null;
  imageAlt?: string | null;
  supportingImages?: BannerSupportingImage[];
  buttonText?: string | null;
  buttonLink?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export async function createBanner(
  payload: BannerPayload & { title: string; desktopImageUrl: string },
): Promise<AdminBanner> {
  return apiFetch<AdminBanner>("/admin/banners", {
    method: "POST",
    body: payload,
  });
}

export async function updateBanner(
  id: string,
  payload: BannerPayload,
): Promise<AdminBanner> {
  return apiFetch<AdminBanner>(`/admin/banners/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteBanner(id: string): Promise<void> {
  await apiFetch(`/admin/banners/${id}`, { method: "DELETE" });
}

export async function reorderBanners(
  items: { id: string; sortOrder: number }[],
): Promise<void> {
  await apiFetch("/admin/banners/reorder", {
    method: "PATCH",
    body: { items },
  });
}
