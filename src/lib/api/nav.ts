import type { CategoryTreeNode } from "@/types/catalog";

import { publicApiFetch } from "./server";

/**
 * Builds the storefront nav from `GET /categories/menu` (API-HOMEPAGE.md §1):
 * one call returns the active category tree plus each root's admin-curated
 * megamenu products. Roots become navbar items, level-2 categories become
 * panel columns, level-3 the column links, and `recommendedProducts` fills
 * the panel's OUR RECOMMENDATION grid. Server components call this and pass
 * the plain result to the client nav components.
 */

export interface NavColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface NavProductCard {
  id: string;
  slug: string;
  title: string;
  image: string | null;
}

export interface ResolvedNavItem {
  label: string;
  href: string;
  highlight?: boolean;
  panel?: {
    columns: NavColumn[];
    recommended: NavProductCard[];
  };
}

/** The slice of a menu product the nav cards need. */
interface ApiMenuProduct {
  id: string;
  slug: string;
  name: string;
  images: { url: string; alt: string | null }[];
}

/** Root node of `/categories/menu` — the tree plus admin-curated picks. */
interface ApiMenuNode extends CategoryTreeNode {
  recommendedProducts?: ApiMenuProduct[];
}

const REVALIDATE_SECONDS = 300;

const NEW_IN: ResolvedNavItem = { label: "New In", href: "/products?sort=newest" };
const SALE: ResolvedNavItem = {
  label: "Sale",
  href: "/products?sale=1",
  highlight: true,
};

const productsHref = (slug: string) =>
  `/products?category=${encodeURIComponent(slug)}`;

function toColumns(root: CategoryTreeNode): NavColumn[] {
  return root.children.map((child) => ({
    title: child.name,
    // A mid-level category with no children of its own still gets a link —
    // to itself — so no active category is unreachable from the menu.
    links: (child.children.length > 0 ? child.children : [child]).map(
      (category) => ({
        label: category.name,
        href: productsHref(category.slug),
      }),
    ),
  }));
}

function toCards(products: ApiMenuProduct[] = []): NavProductCard[] {
  return products.map(({ id, slug, name, images }) => ({
    id,
    slug,
    title: name,
    image: images[0]?.url ?? null,
  }));
}

export async function getNavMenu(): Promise<ResolvedNavItem[]> {
  let menu: ApiMenuNode[];
  try {
    menu = await publicApiFetch<ApiMenuNode[]>("/categories/menu", {
      revalidate: REVALIDATE_SECONDS,
    });
  } catch {
    // Backend unreachable — keep the header usable with the static entries.
    return [NEW_IN, SALE];
  }

  const categoryItems = menu.map((root): ResolvedNavItem =>
    root.children.length === 0
      ? { label: root.name, href: productsHref(root.slug) }
      : {
          label: root.name,
          href: productsHref(root.slug),
          panel: {
            columns: toColumns(root),
            recommended: toCards(root.recommendedProducts),
          },
        },
  );

  return [NEW_IN, ...categoryItems, SALE];
}
