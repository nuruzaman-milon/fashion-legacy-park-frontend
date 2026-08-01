import type {
  AdminFlashSaleItem,
  AdminFlashSaleRule,
} from "@/lib/api/admin/flash-sales";
import type { AdminCategory } from "@/types/admin";

/**
 * Client-side mirror of the backend's flash-price resolution, so the editor
 * can show the exact storefront price per row: precedence VARIANT > PRODUCT
 * > CATEGORY (matched through the ancestor chain), lowest price within the
 * winning tier.
 */

export function applyDiscount(
  price: number,
  rule: {
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    maxDiscount: number | null;
  },
): number {
  let discount =
    rule.discountType === "PERCENTAGE"
      ? (price * rule.discountValue) / 100
      : rule.discountValue;
  if (rule.maxDiscount !== null) discount = Math.min(discount, rule.maxDiscount);
  return Math.round(Math.max(0, price - discount) * 100) / 100;
}

const applyRule = (price: number, rule: AdminFlashSaleRule): number =>
  applyDiscount(price, {
    discountType: rule.discountType,
    discountValue: Number(rule.discountValue),
    maxDiscount: rule.maxDiscount === null ? null : Number(rule.maxDiscount),
  });

export function buildParentMap(
  categories: AdminCategory[],
): Map<string, string | null> {
  return new Map(categories.map((c) => [c.id, c.parentId]));
}

/** The category and everything under it — for bulk-adding a whole branch. */
export function subtreeIds(
  rootId: string,
  categories: AdminCategory[],
): Set<string> {
  const ids = new Set([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of categories) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }
  return ids;
}

function ancestry(
  categoryId: string,
  parentOf: Map<string, string | null>,
): Set<string> {
  const seen = new Set<string>();
  let cursor: string | null | undefined = categoryId;
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    cursor = parentOf.get(cursor);
  }
  return seen;
}

export interface EffectiveDeal {
  price: number;
  /** The winning rule — its scope tells the UI where the price comes from. */
  rule: AdminFlashSaleRule;
}

/** null = no rule prices this item, so the storefront hides it. */
export function effectiveDeal(
  item: AdminFlashSaleItem,
  rules: AdminFlashSaleRule[],
  parentOf: Map<string, string | null>,
): EffectiveDeal | null {
  const lineage = ancestry(item.variant.product.categoryId, parentOf);
  const tiers = [
    rules.filter((r) => r.scope === "VARIANT" && r.variantId === item.variantId),
    rules.filter(
      (r) => r.scope === "PRODUCT" && r.productId === item.variant.product.id,
    ),
    rules.filter(
      (r) =>
        r.scope === "CATEGORY" && r.categoryId && lineage.has(r.categoryId),
    ),
  ];
  const matched = tiers.find((tier) => tier.length > 0);
  if (!matched) return null;

  const price = Number(item.variant.price);
  let best: EffectiveDeal | null = null;
  for (const rule of matched) {
    const candidate = applyRule(price, rule);
    if (best === null || candidate < best.price) {
      best = { price: candidate, rule };
    }
  }
  return best;
}
