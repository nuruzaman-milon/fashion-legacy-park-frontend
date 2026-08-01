import type { Metadata } from "next";

import { ReviewTable } from "@/components/admin/reviews/review-table";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Reviews" };

export default function AdminReviewsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <PageHeader
        title="Reviews"
        description="Customer reviews wait here until approved — nothing reaches product pages unmoderated."
        className="mb-2"
      />
      <ReviewTable />
    </div>
  );
}
