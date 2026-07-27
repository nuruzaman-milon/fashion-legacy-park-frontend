"use client";

import Link from "next/link";
import { MailCheckIcon } from "lucide-react";

import { ResendVerification } from "@/components/auth/resend-verification";
import {
  AuthCardDivider,
  AuthEmailChip,
  AuthStatusCard,
} from "@/components/auth/status-card";

/** Post-registration screen: the verification link is in their inbox. */
export function CheckEmailCard({ email }: { email?: string }) {
  return (
    <AuthStatusCard
      icon={MailCheckIcon}
      title="Check your email"
      description={
        email
          ? "Your account is one click away. We sent a verification link to"
          : "Your account is one click away — open the verification link we emailed you."
      }
    >
      {email && <AuthEmailChip email={email} />}
      <p className="mt-4 text-xs text-muted-foreground">
        The link stays valid for 24 hours. No sign of it? Check your spam
        folder first.
      </p>

      <AuthCardDivider label="Didn't get it?" />
      <ResendVerification email={email} className="mt-4" />

      <p className="mt-8 text-sm text-muted-foreground">
        Verified already?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </AuthStatusCard>
  );
}
