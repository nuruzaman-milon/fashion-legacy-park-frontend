import type { Metadata } from "next";

import { ModuleStub } from "@/components/admin/module-stub";

export const metadata: Metadata = { title: "Options" };

export default function AdminOptionsPage() {
  return (
    <ModuleStub
      title="Options"
      description="The shared option library — colours, sizes and other variant axes."
    />
  );
}
