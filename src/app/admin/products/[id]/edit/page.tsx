import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLinkIcon } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { ImagesSection } from "@/components/admin/products/images-section";
import { ProductForm } from "@/components/admin/products/product-form";
import { VariantsSection } from "@/components/admin/products/variants-section";
import { Button } from "@/components/ui/button";
import {
  mockAdminBrands,
  mockAdminCategories,
  mockAdminProductDetail,
  mockAdminProducts,
} from "@/lib/api/mock/admin-data";
import type { AdminProductDetail } from "@/types/admin";

export const metadata: Metadata = { title: "Edit product" };

/** Only the gown has full mock detail; other rows get an empty-detail shell. */
function detailFor(id: string): AdminProductDetail | undefined {
  if (id === mockAdminProductDetail.id) return mockAdminProductDetail;
  const listItem = mockAdminProducts.find((p) => p.id === id);
  if (!listItem) return undefined;
  return {
    ...listItem,
    shortDescription: null,
    description: null,
    videoUrl: null,
    specifications: null,
    tags: [],
    rejectionReason:
      listItem.status === "REJECTED"
        ? "Photos are too dark to judge the weave — please reshoot in daylight."
        : null,
    metaTitle: null,
    metaDescription: null,
    metaKeywords: null,
    options: [],
    variants: [],
    images: listItem.images.map((img, index) => ({
      ...img,
      publicId: null,
      optionValueId: null,
      sortOrder: index,
    })),
  };
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = detailFor(id);
  if (!product) notFound();

  const categories = mockAdminCategories.map((c) => ({
    id: c.id,
    name: c.parentId
      ? `${mockAdminCategories.find((p) => p.id === c.parentId)?.name} › ${c.name}`
      : c.name,
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title={product.name} description={`/${product.slug}`}>
        <Button
          variant="outline"
          render={<Link href={`/products/${product.slug}`} target="_blank" />}
        >
          <ExternalLinkIcon data-icon="inline-start" />
          View in store
        </Button>
      </PageHeader>
      <ProductForm
        initial={product}
        categories={categories}
        brands={mockAdminBrands}
      />
      <ImagesSection images={product.images} options={product.options} />
      <VariantsSection options={product.options} variants={product.variants} />
    </div>
  );
}
