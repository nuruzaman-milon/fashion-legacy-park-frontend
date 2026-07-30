import { apiFetch } from "@/lib/api/client";
import type { Paginated } from "@/types/admin";

export type OptionDisplayType = "DROPDOWN" | "SWATCH" | "BUTTON";

/**
 * The global option library (`GET /options`, public): active options with
 * their active values — what the attach-options picker offers.
 */
export interface OptionLibraryItem {
  id: string;
  name: string;
  slug: string;
  displayType: OptionDisplayType;
  sortOrder: number;
  values: {
    id: string;
    value: string;
    hexColor: string | null;
    sortOrder: number;
  }[];
}

export async function getOptionLibrary(): Promise<OptionLibraryItem[]> {
  return apiFetch<OptionLibraryItem[]>("/options");
}

// ---------------------------------------------------------------------------
// Admin CRUD (`/admin/options`, `/admin/option-values`)
// ---------------------------------------------------------------------------

export interface AdminOptionValue {
  id: string;
  optionId: string;
  value: string;
  slug: string;
  hexColor: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminOption {
  id: string;
  name: string;
  slug: string;
  displayType: OptionDisplayType;
  sortOrder: number;
  isActive: boolean;
  /** Every value, inactive included, sorted by the backend. */
  values: AdminOptionValue[];
  /** How many products use this option — deletes 409 while > 0. */
  productCount: number;
}

interface ApiOptionDetail extends Omit<AdminOption, "productCount"> {
  _count: { productOptions: number };
}

/**
 * The admin list carries only value counts, so each option's values come
 * from its detail endpoint — the library is a handful of rows, so the
 * fan-out is cheap.
 */
export async function getAdminOptions(): Promise<AdminOption[]> {
  const { items } = await apiFetch<Paginated<{ id: string }>>(
    "/admin/options?limit=100",
  );
  return Promise.all(
    items.map(async (item) => {
      const { _count, ...option } = await apiFetch<ApiOptionDetail>(
        `/admin/options/${item.id}`,
      );
      return { ...option, productCount: _count.productOptions };
    }),
  );
}

export interface OptionPayload {
  name?: string;
  displayType?: OptionDisplayType;
  sortOrder?: number;
  isActive?: boolean;
}

export async function createOption(
  payload: OptionPayload & { name: string },
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>("/admin/options", {
    method: "POST",
    body: payload,
  });
}

export async function updateOption(
  id: string,
  payload: OptionPayload,
): Promise<void> {
  await apiFetch(`/admin/options/${id}`, { method: "PATCH", body: payload });
}

/** 409s while any product uses the option. */
export async function deleteOption(id: string): Promise<void> {
  await apiFetch(`/admin/options/${id}`, { method: "DELETE" });
}

export interface OptionValuePayload {
  value?: string;
  /** Required by the backend when the parent option is a SWATCH. */
  hexColor?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export async function createOptionValue(
  optionId: string,
  payload: OptionValuePayload & { value: string },
): Promise<AdminOptionValue> {
  return apiFetch<AdminOptionValue>(`/admin/options/${optionId}/values`, {
    method: "POST",
    body: payload,
  });
}

export async function updateOptionValue(
  id: string,
  payload: OptionValuePayload,
): Promise<AdminOptionValue> {
  return apiFetch<AdminOptionValue>(`/admin/option-values/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

/** 409s while any variant is built on the value. */
export async function deleteOptionValue(id: string): Promise<void> {
  await apiFetch(`/admin/option-values/${id}`, { method: "DELETE" });
}
