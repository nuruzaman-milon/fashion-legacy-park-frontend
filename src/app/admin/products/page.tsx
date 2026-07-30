import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { ProductTable } from "@/components/admin/products/product-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Products" };

export default function AdminProductsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Products"
        description="Everything in the catalog — drafts, seller submissions and live items."
      >
        <Button render={<Link href="/admin/products/new" />}>
          <PlusIcon data-icon="inline-start" />
          Add product
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="space-y-4">
          <ProductTable />
        </CardContent>
      </Card>
    </div>
  );
}
