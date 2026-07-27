import type { Metadata } from "next";

import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = {
  title: "My account",
  description: "Manage your Fashion Legacy profile.",
};

export default function AccountPage() {
  return <ProfileForm />;
}
