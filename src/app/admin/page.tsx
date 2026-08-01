import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { DashboardView } from "@/components/admin/dashboard-view";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Store overview — live figures from orders, catalogue and customers."
      >
        <Button render={<Link href="/admin/products/new" />}>
          <PlusIcon data-icon="inline-start" />
          Add product
        </Button>
      </PageHeader>
      <DashboardView />
    </div>
  );
}
