import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a link to reset your Fashion Legacy account password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
