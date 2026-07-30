import type { Metadata } from "next";

import { ModuleStub } from "@/components/admin/module-stub";

export const metadata: Metadata = { title: "Brands" };

export default function AdminBrandsPage() {
  return (
    <ModuleStub
      title="Brands"
      description="House labels and partner brands sold in the store."
    />
  );
}
