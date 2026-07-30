import type { Metadata } from "next";

import { ModuleStub } from "@/components/admin/module-stub";

export const metadata: Metadata = { title: "Users" };

export default function AdminUsersPage() {
  return (
    <ModuleStub
      title="Users"
      description="Customer and staff accounts, roles and access."
    />
  );
}
