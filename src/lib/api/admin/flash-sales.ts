import { apiFetch } from "@/lib/api/client";
import type { Paginated } from "@/types/admin";

/**
 * Flash-sale campaigns (`/admin/flash-sales`, bearer). A sale is a time
 * window plus two sets: RULES decide the discounted price (scope precedence
 * VARIANT > PRODUCT > CATEGORY, lowest price wins within a tier) and ITEMS
 * pick which variants participate. A variant appears on the storefront only
 * when it is an item AND some rule prices it — either half alone shows
 * nothing.
 */

export type FlashSaleScope = "CATEGORY" | "PRODUCT" | "VARIANT";
export type FlashSaleDiscountType = "PERCENTAGE" | "FIXED";

export interface AdminFlashSale {
  id: string;
  title: string;
  description: string | null;
  banner: string | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AdminFlashSaleListItem = AdminFlashSale & {
  _count: { rules: number; items: number };
};

export interface AdminFlashSaleRule {
  id: string;
  scope: FlashSaleScope;
  categoryId: string | null;
  productId: string | null;
  variantId: string | null;
  discountType: FlashSaleDiscountType;
  /** Prisma Decimal → string. */
  discountValue: string;
  maxDiscount: string | null;
  category: { id: string; name: string; slug: string } | null;
  product: { id: string; name: string; slug: string } | null;
  variant: { id: string; name: string; sku: string } | null;
}

export interface AdminFlashSaleItem {
  id: string;
  variantId: string;
  quantityLimit: number | null;
  soldCount: number;
  variant: {
    id: string;
    name: string;
    sku: string;
    price: string;
    product: { id: string; name: string; slug: string; categoryId: string };
  };
}

export interface AdminFlashSaleDetail extends AdminFlashSale {
  rules: AdminFlashSaleRule[];
  items: AdminFlashSaleItem[];
}

/** One page covers any realistic campaign list (backend caps limit at 100). */
export async function getAdminFlashSales(): Promise<AdminFlashSaleListItem[]> {
  const { items } = await apiFetch<Paginated<AdminFlashSaleListItem>>(
    "/admin/flash-sales?limit=100&sortBy=startsAt&sortOrder=desc",
  );
  return items;
}

export async function getAdminFlashSale(
  id: string,
): Promise<AdminFlashSaleDetail> {
  return apiFetch<AdminFlashSaleDetail>(`/admin/flash-sales/${id}`);
}

export interface FlashSalePayload {
  title?: string;
  description?: string | null;
  /** Image URL; the FlashSale table has no publicId column to pair it with. */
  banner?: string | null;
  /** ISO datetimes; the backend rejects endsAt ≤ startsAt. */
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}

export async function createFlashSale(
  payload: FlashSalePayload & {
    title: string;
    startsAt: string;
    endsAt: string;
  },
): Promise<AdminFlashSale> {
  return apiFetch<AdminFlashSale>("/admin/flash-sales", {
    method: "POST",
    body: payload,
  });
}

export async function updateFlashSale(
  id: string,
  payload: FlashSalePayload,
): Promise<AdminFlashSale> {
  return apiFetch<AdminFlashSale>(`/admin/flash-sales/${id}`, {
    method: "PATCH",
    body: payload,
  });
}

/** Rules and items cascade with the sale. */
export async function deleteFlashSale(id: string): Promise<void> {
  await apiFetch(`/admin/flash-sales/${id}`, { method: "DELETE" });
}

/** Exactly the one id matching `scope` may be set. */
export interface FlashSaleRulePayload {
  scope: FlashSaleScope;
  categoryId?: string;
  productId?: string;
  variantId?: string;
  discountType: FlashSaleDiscountType;
  discountValue: number;
  /** Caps a PERCENTAGE discount in absolute ৳. */
  maxDiscount?: number;
}

/** Full replace. The response carries no target names — refetch the detail. */
export async function setFlashSaleRules(
  id: string,
  rules: FlashSaleRulePayload[],
): Promise<void> {
  await apiFetch(`/admin/flash-sales/${id}/rules`, {
    method: "PUT",
    body: { rules },
  });
}

export interface FlashSaleItemPayload {
  variantId: string;
  /** null = uncapped. Must not undercut what already sold in a live sale. */
  quantityLimit?: number | null;
}

/** Full replace, diffed server-side so a live sale keeps its soldCounts. */
export async function setFlashSaleItems(
  id: string,
  items: FlashSaleItemPayload[],
): Promise<void> {
  await apiFetch(`/admin/flash-sales/${id}/items`, {
    method: "PUT",
    body: { items },
  });
}

/** Stored rule → payload, for resending the untouched rest of the set. */
export function ruleToPayload(rule: AdminFlashSaleRule): FlashSaleRulePayload {
  return {
    scope: rule.scope,
    ...(rule.categoryId && { categoryId: rule.categoryId }),
    ...(rule.productId && { productId: rule.productId }),
    ...(rule.variantId && { variantId: rule.variantId }),
    discountType: rule.discountType,
    discountValue: Number(rule.discountValue),
    ...(rule.maxDiscount !== null && { maxDiscount: Number(rule.maxDiscount) }),
  };
}

export function itemToPayload(item: AdminFlashSaleItem): FlashSaleItemPayload {
  return { variantId: item.variantId, quantityLimit: item.quantityLimit };
}
