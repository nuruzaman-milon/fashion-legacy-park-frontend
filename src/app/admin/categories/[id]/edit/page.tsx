import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CategoryForm } from "@/components/admin/categories/category-form";
import { PageHeader } from "@/components/admin/page-header";
import { mockAdminCategories } from "@/lib/api/mock/admin-data";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = mockAdminCategories.find((c) => c.id === id);
  if (!category) notFound();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title={category.name} description={`/${category.slug}`} />
      <CategoryForm initial={category} categories={mockAdminCategories} />
    </div>
  );
}
