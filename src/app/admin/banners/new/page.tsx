import type { Metadata } from "next";

import { BannerForm } from "@/components/admin/banners/banner-form";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "New banner" };

export default function NewBannerPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title="New banner" />
      <BannerForm />
    </div>
  );
}
