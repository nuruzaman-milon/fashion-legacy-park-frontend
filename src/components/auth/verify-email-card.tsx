"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheckIcon, MailOpenIcon } from "lucide-react";

import { FormAlert } from "@/components/auth/form-alert";
import { ResendVerification } from "@/components/auth/resend-verification";
import {
  AuthCardDivider,
  AuthStatusCard,
} from "@/components/auth/status-card";
import { Button } from "@/components/ui/button";
import { verifyEmail } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

type Phase = "idle" | "verifying" | "success" | "error";

/**
 * Landing card for the /verify-email?token=... link. Verification tokens are
 * single-use, so this submits on a button click rather than on mount — that
 * survives StrictMode double-effects and stops link-scanning email software
 * from consuming the token before the user opens the page.
 */
export function VerifyEmailCard({ token }: { token?: string }) {
  const [phase, setPhase] = React.useState<Phase>(token ? "idle" : "error");
  const [error, setError] = React.useState<string | null>(
    token
      ? null
      : "This link is missing its verification code. Open the link from the email again, or request a fresh one below.",
  );

  async function verify() {
    if (!token) return;
    setPhase("verifying");
    try {
      await verifyEmail(token);
      setPhase("success");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setPhase("error");
    }
  }

  if (phase === "success") {
    return (
      <AuthStatusCard
        icon={BadgeCheckIcon}
        iconClassName="bg-emerald-600/10 text-emerald-700 ring-emerald-600/5"
        title="Email verified!"
        description="Your account is live. Sign in and start shopping."
      >
        <Button
          className="mt-8 h-12 w-full text-base"
          render={<Link href="/login" />}
        >
          Sign in to your account
        </Button>
      </AuthStatusCard>
    );
  }

  return (
    <AuthStatusCard
      icon={MailOpenIcon}
      title="Verify your email"
      description="One click confirms this address is yours and activates your account."
    >
      {phase === "error" && error && (
        <FormAlert className="mt-6 text-left">{error}</FormAlert>
      )}

      {token && (
        <>
          <Button
            className="mt-8 h-12 w-full text-base"
            disabled={phase === "verifying"}
            onClick={() => void verify()}
          >
            {phase === "verifying" ? "Verifying…" : "Verify my email"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            The link works once and expires 24 hours after it was sent.
          </p>
        </>
      )}

      {phase === "error" && (
        <>
          <AuthCardDivider label="Need a new link?" />
          <ResendVerification className="mt-4" />
        </>
      )}

      <p className="mt-8 text-sm text-muted-foreground">
        Wrong place?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthStatusCard>
  );
}
