import type { Metadata } from "next";

import { ModuleStub } from "@/components/admin/module-stub";

export const metadata: Metadata = { title: "Sellers" };

export default function AdminSellersPage() {
  return (
    <ModuleStub
      title="Sellers"
      description="Marketplace sellers — onboarding, commissions and payouts."
    />
  );
}
