import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create your Fashion Legacy account — save your cart, track orders and check out faster.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
