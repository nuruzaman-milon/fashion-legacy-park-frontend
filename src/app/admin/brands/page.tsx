import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { BrandTable } from "@/components/admin/brands/brand-table";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Brands" };

export default function AdminBrandsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Brands"
        description="House labels and partner brands sold in the store."
      >
        <Button render={<Link href="/admin/brands/new" />}>
          <PlusIcon data-icon="inline-start" />
          New brand
        </Button>
      </PageHeader>

      <Card>
        <CardContent>
          <BrandTable />
        </CardContent>
      </Card>
    </div>
  );
}
