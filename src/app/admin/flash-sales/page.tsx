import type { Metadata } from "next";

import { ModuleStub } from "@/components/admin/module-stub";

export const metadata: Metadata = { title: "Flash sales" };

export default function AdminFlashSalesPage() {
  return (
    <ModuleStub
      title="Flash sales"
      description="Timed campaigns with per-category, per-product or per-variant discounts."
    />
  );
}
