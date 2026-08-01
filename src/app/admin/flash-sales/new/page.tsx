import type { Metadata } from "next";

import { FlashSaleForm } from "@/components/admin/flash-sales/flash-sale-form";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "New flash sale" };

export default function NewFlashSalePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="New flash sale" />
      <FlashSaleForm />
    </div>
  );
}
