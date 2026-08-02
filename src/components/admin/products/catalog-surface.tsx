"use client";

import * as React from "react";

import { adminCatalogApi } from "@/lib/api/admin/products";
import { sellerCatalogApi } from "@/lib/api/seller/products";
import { getAdminCategories } from "@/lib/api/admin/categories";
import { getAdminBrands, type AdminBrand } from "@/lib/api/admin/brands";
import { apiFetch } from "@/lib/api/client";
import type { CatalogApi } from "@/lib/api/catalog";
import type { AdminCategory } from "@/types/admin";
import type { CategoryTreeNode } from "@/types/catalog";

/**
 * Which portal the product-management components are serving. The backend
 * runs the same router for both — this context swaps the bound API client,
 * the route prefix for links, and the category/brand sources (sellers read
 * the public endpoints; /admin/categories & /admin/brands would 403).
 * Defaults to admin so the existing admin pages need no provider.
 */
export interface CatalogSurface {
  kind: "admin" | "seller";
  api: CatalogApi;
  /** List/new/edit pages live under here, e.g. "/admin/products". */
  basePath: string;
  getCategories: () => Promise<AdminCategory[]>;
  getBrands: () => Promise<AdminBrand[]>;
}

const adminSurface: CatalogSurface = {
  kind: "admin",
  api: adminCatalogApi,
  basePath: "/admin/products",
  getCategories: getAdminCategories,
  getBrands: getAdminBrands,
};

/**
 * The public tree (active categories only) flattened into the shape the
 * cascade and path-label helpers expect. The admin-only columns are
 * defaulted — nothing in the pickers reads them.
 */
function flattenTree(
  nodes: CategoryTreeNode[],
  parentId: string | null,
  acc: AdminCategory[],
): AdminCategory[] {
  for (const node of nodes) {
    acc.push({
      id: node.id,
      name: node.name,
      slug: node.slug,
      description: null,
      icon: node.icon,
      image: node.image,
      banner: null,
      parentId,
      sortOrder: node.sortOrder,
      isActive: true,
      showOnHome: false,
      homeSortOrder: 0,
      metaTitle: null,
      metaDescription: null,
      metaKeywords: null,
      createdAt: "",
      updatedAt: "",
      _count: { children: node.children.length, products: node.productCount },
    });
    flattenTree(node.children, node.id, acc);
  }
  return acc;
}

const sellerSurface: CatalogSurface = {
  kind: "seller",
  api: sellerCatalogApi,
  basePath: "/seller/products",
  getCategories: async () =>
    flattenTree(await apiFetch<CategoryTreeNode[]>("/categories/tree"), null, []),
  getBrands: async () => apiFetch<AdminBrand[]>("/brands"),
};

const CatalogSurfaceContext = React.createContext<CatalogSurface>(adminSurface);

export function useCatalogSurface(): CatalogSurface {
  return React.useContext(CatalogSurfaceContext);
}

/** Wrap seller pages in this; admin pages use the default. */
export function SellerCatalogSurface({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CatalogSurfaceContext.Provider value={sellerSurface}>
      {children}
    </CatalogSurfaceContext.Provider>
  );
}
