import type { Metadata } from "next";

import { SellerForm } from "@/components/admin/sellers/seller-form";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Edit seller" };

export default async function EditSellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Edit seller" />
      <SellerForm sellerId={id} />
    </div>
  );
}
