import type { Metadata } from "next";

import { BrandForm } from "@/components/admin/brands/brand-form";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "New brand" };

export default function NewBrandPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title="New brand" />
      <BrandForm />
    </div>
  );
}
