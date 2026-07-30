import type { Metadata } from "next";

import { BrandForm } from "@/components/admin/brands/brand-form";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Edit brand" };

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title="Edit brand" />
      <BrandForm brandId={id} />
    </div>
  );
}
