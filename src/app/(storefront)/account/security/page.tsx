import type { Metadata } from "next";

import { ChangeEmailForm } from "@/components/account/change-email-form";
import { ChangePasswordForm } from "@/components/account/change-password-form";

export const metadata: Metadata = {
  title: "Security",
  description: "Change your Fashion Legacy password or email address.",
};

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <ChangePasswordForm />
      <ChangeEmailForm />
    </div>
  );
}
