import type { Metadata } from "next";

import { FlashSaleEditor } from "@/components/admin/flash-sales/flash-sale-editor";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Edit flash sale" };

export default async function EditFlashSalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="Edit flash sale" />
      <FlashSaleEditor saleId={id} />
    </div>
  );
}
