import type { Metadata } from "next";

import { ConfirmEmailChangeCard } from "@/components/auth/confirm-email-change-card";

export const metadata: Metadata = {
  title: "Confirm email change",
  description: "Confirm your new email address for your Fashion Legacy account.",
};

export default async function ConfirmEmailChangePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).token;
  const token = Array.isArray(raw) ? raw[0] : raw;
  return <ConfirmEmailChangeCard token={token} />;
}
