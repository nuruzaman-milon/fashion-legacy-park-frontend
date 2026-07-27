import type { Metadata } from "next";

import { SessionsList } from "@/components/account/sessions-list";

export const metadata: Metadata = {
  title: "Devices",
  description: "See and manage every device signed in to your account.",
};

export default function SessionsPage() {
  return <SessionsList />;
}
