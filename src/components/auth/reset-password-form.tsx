"use client";

import * as React from "react";
import Link from "next/link";
import { KeyRoundIcon } from "lucide-react";
import * as z from "zod";

import { FieldError } from "@/components/auth/field-error";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthStatusCard } from "@/components/auth/status-card";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { passwordSchema } from "@/lib/auth/validation";

const resetSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface ResetState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  /** The token was rejected — offer a fresh link instead of a retry. */
  tokenDead?: boolean;
  done?: boolean;
}

export function ResetPasswordForm({ token }: { token?: string }) {
  // Controlled so a failed attempt never wipes the fields — React resets
  // uncontrolled inputs when a form action completes.
  const [values, setValues] = React.useState({
    password: "",
    confirmPassword: "",
  });
  const update =
    (name: "password" | "confirmPassword") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [name]: e.target.value }));

  const [state, formAction, pending] = React.useActionState<
    ResetState | undefined,
    FormData
  >(async () => {
    if (!token) return undefined;
    const parsed = resetSchema.safeParse(values);
    if (!parsed.success) {
      return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }

    try {
      await resetPassword(token, parsed.data.password);
      return { done: true };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.fieldErrors) {
          return { formError: error.message, fieldErrors: error.fieldErrors };
        }
        // A 400 without field errors is a rejected token (invalid, expired,
        // already used) or a social-only account — retrying cannot help.
        return { formError: error.message, tokenDead: error.status === 400 };
      }
      return { formError: "Something went wrong. Please try again." };
    }
  }, undefined);

  if (state?.done) {
    return (
      <AuthStatusCard
        icon={KeyRoundIcon}
        iconClassName="bg-emerald-600/10 text-emerald-700 ring-emerald-600/5"
        title="Password reset"
        description="Every device has been signed out for safety. Sign in with your new password to continue."
      >
        <Button
          className="mt-8 h-12 w-full text-base"
          render={<Link href="/login" />}
        >
          Sign in
        </Button>
      </AuthStatusCard>
    );
  }

  if (!token) {
    return (
      <AuthStatusCard
        icon={KeyRoundIcon}
        title="Reset your password"
        description="This link is missing its reset code. Open the link from the email again, or request a fresh one."
      >
        <Button
          className="mt-8 h-12 w-full text-base"
          render={<Link href="/forgot-password" />}
        >
          Request a new link
        </Button>
      </AuthStatusCard>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-medium tracking-tight sm:text-3xl">
        Choose a new password
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Resetting it signs you out of every device.
      </p>

      <div className="mt-8 space-y-5">
        {state?.formError && (
          <FormAlert>
            {state.formError}
            {state.tokenDead && (
              <>
                {" "}
                <Link
                  href="/forgot-password"
                  className="font-medium underline underline-offset-2"
                >
                  Request a new link
                </Link>
              </>
            )}
          </FormAlert>
        )}

        <form className="space-y-4" action={formAction}>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              New password
            </label>
            <PasswordInput
              id="password"
              name="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={values.password}
              onChange={update("password")}
            />
            <FieldError messages={state?.fieldErrors?.password} />
            <p className="text-xs text-muted-foreground">
              8+ characters with an uppercase letter, a lowercase letter, a
              digit and one of @ $ ! % * ? &
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              Confirm new password
            </label>
            <PasswordInput
              id="confirm-password"
              name="confirmPassword"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Repeat your new password"
              value={values.confirmPassword}
              onChange={update("confirmPassword")}
            />
            <FieldError messages={state?.fieldErrors?.confirmPassword} />
          </div>

          <Button
            type="submit"
            className="h-11 w-full text-base"
            disabled={pending}
          >
            {pending ? "Resetting…" : "Reset password"}
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
