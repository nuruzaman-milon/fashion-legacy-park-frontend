import type { Metadata } from "next";

import { UserTable } from "@/components/admin/users/user-table";
import { PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Users" };

export default function AdminUsersPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <PageHeader
        title="Users"
        description="Every account on the store — roles decide what they can do, deactivation locks them out."
        className="mb-2"
      />
      <UserTable />
    </div>
  );
}
