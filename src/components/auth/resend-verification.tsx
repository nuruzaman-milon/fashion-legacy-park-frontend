"use client";

import * as React from "react";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { resendVerification as resendVerificationApi } from "@/lib/api/auth";

/**
 * "Send me a new verification link" block. When the address is already known
 * (register success, unverified login) it is just a button; otherwise it asks
 * for the email. The backend answers 200 either way (anti-enumeration), so
 * the sent state shows its non-committal wording verbatim.
 */
export function ResendVerification({
  email: knownEmail,
  className,
}: {
  email?: string;
  className?: string;
}) {
  const [email, setEmail] = React.useState(knownEmail ?? "");
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function send() {
    const parsed = z.email().safeParse(email.trim().toLowerCase());
    if (!parsed.success) {
      setError("Please enter a valid email address");
      return;
    }
    setError(null);
    setSending(true);
    try {
      await resendVerificationApi(parsed.data);
      setSent(true);
      setCooldown(30);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={className}>
      {!knownEmail && (
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          aria-label="Email address"
          className="mb-2 h-10"
        />
      )}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={sending || cooldown > 0}
        onClick={() => void send()}
      >
        {sending
          ? "Sending…"
          : cooldown > 0
            ? `Link sent — resend in ${cooldown}s`
            : sent
              ? "Resend again"
              : "Resend verification email"}
      </Button>
      {sent && !error && (
        <p className="mt-2 text-xs text-muted-foreground">
          If that email belongs to an unverified account, a new link is on its
          way. It stays valid for 24 hours.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
