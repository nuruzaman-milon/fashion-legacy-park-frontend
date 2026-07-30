import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { CategoryTree } from "@/components/admin/categories/category-tree";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mockAdminCategories } from "@/lib/api/mock/admin-data";

export const metadata: Metadata = { title: "Categories" };

export default function AdminCategoriesPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Categories"
        description="Structure the catalog — three levels deep, ordered the way the storefront menu shows them."
      >
        <Button render={<Link href="/admin/categories/new" />}>
          <PlusIcon data-icon="inline-start" />
          New category
        </Button>
      </PageHeader>

      <Card>
        <CardContent>
          <CategoryTree categories={mockAdminCategories} />
        </CardContent>
      </Card>
    </div>
  );
}
