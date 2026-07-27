"use client";

import * as React from "react";
import Link from "next/link";
import * as z from "zod";

import { FieldError } from "@/components/auth/field-error";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

interface ForgotState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  /** The address the link went to. The form stays so it can be re-sent. */
  sentTo?: string;
}

export function ForgotPasswordForm() {
  // Controlled so a failed attempt never wipes the field — React resets
  // uncontrolled inputs when a form action completes.
  const [email, setEmail] = React.useState("");

  const [state, formAction, pending] = React.useActionState<
    ForgotState | undefined,
    FormData
  >(async () => {
    const parsed = z
      .email("Please enter a valid email address")
      .safeParse(email.trim().toLowerCase());
    if (!parsed.success) {
      return { fieldErrors: { email: [parsed.error.issues[0].message] } };
    }

    try {
      await forgotPassword(parsed.data);
      return { sentTo: parsed.data };
    } catch (error) {
      return {
        formError:
          error instanceof ApiError
            ? error.message
            : "Something went wrong. Please try again.",
      };
    }
  }, undefined);

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium tracking-tight sm:text-3xl">
        Forgot your password?
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>

      <div className="mt-8 space-y-5">
        {state?.sentTo && (
          <FormAlert tone="success">
            If <strong>{state.sentTo}</strong> belongs to an account, a reset
            link is on its way. It stays valid for 60 minutes — check your spam
            folder too.
          </FormAlert>
        )}

        {state?.formError && <FormAlert>{state.formError}</FormAlert>}

        <form className="space-y-4" action={formAction}>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="h-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FieldError messages={state?.fieldErrors?.email} />
          </div>

          <Button
            type="submit"
            className="h-11 w-full text-base"
            disabled={pending}
          >
            {pending
              ? "Sending…"
              : state?.sentTo
                ? "Send again"
                : "Send reset link"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
