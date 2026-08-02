import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/page-header";
import { SellerCatalogSurface } from "@/components/admin/products/catalog-surface";
import { ProductForm } from "@/components/admin/products/product-form";

export const metadata: Metadata = { title: "New product" };

export default function SellerNewProductPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title="New product" />
      <SellerCatalogSurface>
        <ProductForm />
      </SellerCatalogSurface>
    </div>
  );
}
