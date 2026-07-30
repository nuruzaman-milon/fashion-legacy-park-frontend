import type { Metadata } from "next";

import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAdmin } from "@/components/auth/require-admin";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: {
    default: `Admin — ${siteConfig.name}`,
    template: `%s — Admin — ${siteConfig.name}`,
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireAdmin>
      <AdminShell>{children}</AdminShell>
    </RequireAdmin>
  );
}
