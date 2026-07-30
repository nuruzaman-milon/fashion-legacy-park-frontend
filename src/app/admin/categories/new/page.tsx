import type { Metadata } from "next";

import { CategoryForm } from "@/components/admin/categories/category-form";
import { PageHeader } from "@/components/admin/page-header";
import { mockAdminCategories } from "@/lib/api/mock/admin-data";

export const metadata: Metadata = { title: "New category" };

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ parent?: string }>;
}) {
  const { parent } = await searchParams;
  const parentExists = mockAdminCategories.some((c) => c.id === parent);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title="New category" />
      <CategoryForm
        categories={mockAdminCategories}
        defaultParentId={parentExists ? (parent ?? null) : null}
      />
    </div>
  );
}
