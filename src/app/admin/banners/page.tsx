import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { BannerList } from "@/components/admin/banners/banner-list";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Banners" };

export default function AdminBannersPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <PageHeader
        title="Banners"
        description="Hero banners for the storefront homepage — the first active one is live."
        className="mb-2"
      >
        <Button render={<Link href="/admin/banners/new" />}>
          <PlusIcon data-icon="inline-start" />
          New banner
        </Button>
      </PageHeader>
      <BannerList />
    </div>
  );
}
