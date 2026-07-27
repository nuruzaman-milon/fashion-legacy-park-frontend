"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheckIcon, MailOpenIcon } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { FormAlert } from "@/components/auth/form-alert";
import {
  AuthEmailChip,
  AuthStatusCard,
} from "@/components/auth/status-card";
import { Button } from "@/components/ui/button";
import { verifyNewEmail } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

type Phase = "idle" | "verifying" | "success" | "error";

/**
 * Landing card for the /confirm-email-change?token=... link — the second
 * half of the change-email flow. Opens from the NEW inbox, possibly in a
 * browser with no session, so this works logged-out too. Single-use token →
 * button-click submit, same as verify-email.
 */
export function ConfirmEmailChangeCard({ token }: { token?: string }) {
  const { status, setUser } = useAuth();
  const [phase, setPhase] = React.useState<Phase>(token ? "idle" : "error");
  const [error, setError] = React.useState<string | null>(
    token
      ? null
      : "This link is missing its confirmation code. Open the link from the email again, or request a fresh one from your account's Security tab.",
  );
  const [newEmail, setNewEmail] = React.useState<string | null>(null);

  async function confirm() {
    if (!token) return;
    setPhase("verifying");
    try {
      const updated = await verifyNewEmail(token);
      setNewEmail(updated.email);
      // If this browser holds the session, reflect the new address at once.
      if (status === "authenticated") setUser(updated);
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
        title="Email updated"
        description="From now on, your account email is"
      >
        {newEmail && <AuthEmailChip email={newEmail} />}
        <p className="mt-4 text-xs text-muted-foreground">
          Use it the next time you sign in.
        </p>
        <Button
          className="mt-8 h-12 w-full text-base"
          render={
            <Link href={status === "authenticated" ? "/account" : "/login"} />
          }
        >
          {status === "authenticated" ? "Back to my account" : "Sign in"}
        </Button>
      </AuthStatusCard>
    );
  }

  return (
    <AuthStatusCard
      icon={MailOpenIcon}
      title="Confirm your new email"
      description="One click moves your account to this address."
    >
      {phase === "error" && error && (
        <FormAlert className="mt-6 text-left">{error}</FormAlert>
      )}

      {token && (
        <>
          <Button
            className="mt-8 h-12 w-full text-base"
            disabled={phase === "verifying"}
            onClick={() => void confirm()}
          >
            {phase === "verifying" ? "Confirming…" : "Confirm email change"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            The link works once and expires 24 hours after it was sent.
          </p>
        </>
      )}

      {phase === "error" && (
        <p className="mt-6 text-sm text-muted-foreground">
          Link expired or already used? Request a new one from{" "}
          <Link
            href="/account/security"
            className="font-medium text-brand hover:underline"
          >
            your account&apos;s Security tab
          </Link>
          .
        </p>
      )}
    </AuthStatusCard>
  );
}
