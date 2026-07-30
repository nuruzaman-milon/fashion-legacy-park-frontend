import type { Metadata } from "next";

import { BannerForm } from "@/components/admin/banners/banner-form";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Edit banner" };

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader title="Edit banner" />
      <BannerForm bannerId={id} />
    </div>
  );
}
