import type { Metadata } from "next";

import { ModuleStub } from "@/components/admin/module-stub";

export const metadata: Metadata = { title: "Banners" };

export default function AdminBannersPage() {
  return (
    <ModuleStub
      title="Banners"
      description="Hero banners rotating on the storefront homepage."
    />
  );
}
