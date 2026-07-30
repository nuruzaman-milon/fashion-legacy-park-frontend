import type { Metadata } from "next";

import { CategoryForm } from "@/components/admin/categories/category-form";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title="Edit category" />
      <CategoryForm categoryId={id} />
    </div>
  );
}
