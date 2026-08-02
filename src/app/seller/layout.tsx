import type { Metadata } from "next";

import { SellerShell } from "@/components/seller/seller-shell";
import { RequireSeller } from "@/components/auth/require-seller";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: {
    default: `Seller — ${siteConfig.name}`,
    template: `%s — Seller — ${siteConfig.name}`,
  },
  robots: { index: false, follow: false },
};

export default function SellerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireSeller>
      <SellerShell>{children}</SellerShell>
    </RequireSeller>
  );
}
