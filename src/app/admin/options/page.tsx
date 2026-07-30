import type { Metadata } from "next";

import { OptionsManager } from "@/components/admin/options/options-manager";

export const metadata: Metadata = { title: "Options" };

export default function AdminOptionsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <OptionsManager />
    </div>
  );
}
