import type { Metadata } from "next";

import { SellerForm } from "@/components/admin/sellers/seller-form";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "New seller" };

export default function NewSellerPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title="New seller" />
      <SellerForm />
    </div>
  );
}
