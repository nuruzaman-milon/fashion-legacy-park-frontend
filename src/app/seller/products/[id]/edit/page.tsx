import type { Metadata } from "next";

import { SellerCatalogSurface } from "@/components/admin/products/catalog-surface";
import { ProductEditor } from "@/components/admin/products/product-editor";

export const metadata: Metadata = { title: "Edit product" };

export default async function SellerEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <SellerCatalogSurface>
        <ProductEditor productId={id} />
      </SellerCatalogSurface>
    </div>
  );
}
