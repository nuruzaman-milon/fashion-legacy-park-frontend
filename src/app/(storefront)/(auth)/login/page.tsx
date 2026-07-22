import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to your Fashion Legacy account to see your orders, cart and wishlist.",
};

export default function LoginPage() {
  return <LoginForm />;
}
