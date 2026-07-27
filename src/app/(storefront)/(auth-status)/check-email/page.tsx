import type { Metadata } from "next";

import { CheckEmailCard } from "@/components/auth/check-email-card";

export const metadata: Metadata = {
  title: "Check your email",
  description: "Open the verification link to activate your Fashion Legacy account.",
};

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).email;
  const email = Array.isArray(raw) ? raw[0] : raw;
  return <CheckEmailCard email={email} />;
}
