import {
  navMenuConfig,
  type NavColumn,
  type NavMenuItemConfig,
} from "@/config/nav-menu";

import { mockProducts } from "./mock/home-data";

/**
 * Resolves the declarative nav config against catalog data. Server
 * components call this and pass the plain result to the client nav; the
 * body swaps to `fetch()` when the real backend lands.
 */

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
    newArrivals: NavProductCard[];
  };
}

const NEW_ARRIVALS_LIMIT = 4;

function newArrivalsFor(item: Extract<NavMenuItemConfig, { type: "mega" }>) {
  // Own-category products first (config order), newest first within each.
  return mockProducts
    .filter((p) => item.productsFrom.includes(p.category.slug))
    .sort(
      (a, b) =>
        item.productsFrom.indexOf(a.category.slug) -
          item.productsFrom.indexOf(b.category.slug) ||
        b.publishedAt.localeCompare(a.publishedAt)
    )
    .slice(0, NEW_ARRIVALS_LIMIT)
    .map(({ id, slug, title, image }) => ({ id, slug, title, image }));
}

export async function getNavMenu(): Promise<ResolvedNavItem[]> {
  return navMenuConfig.map((item) =>
    item.type === "link"
      ? { label: item.label, href: item.href, highlight: item.highlight }
      : {
          label: item.label,
          href: item.href,
          panel: {
            columns: item.columns,
            newArrivals: newArrivalsFor(item),
          },
        }
  );
}
