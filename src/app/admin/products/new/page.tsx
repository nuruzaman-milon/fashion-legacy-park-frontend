import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/products/product-form";
import {
  mockAdminBrands,
  mockAdminCategories,
} from "@/lib/api/mock/admin-data";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  const categories = mockAdminCategories.map((c) => ({
    id: c.id,
    name: c.parentId
      ? `${mockAdminCategories.find((p) => p.id === c.parentId)?.name} › ${c.name}`
      : c.name,
  }));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title="New product" />
      <ProductForm categories={categories} brands={mockAdminBrands} />
    </div>
  );
}
