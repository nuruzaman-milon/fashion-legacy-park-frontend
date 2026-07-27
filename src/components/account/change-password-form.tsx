"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as z from "zod";

import { FieldError } from "@/components/auth/field-error";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { changePassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { passwordSchema } from "@/lib/auth/validation";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface State {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

export function ChangePasswordForm() {
  const router = useRouter();

  // Controlled so a failed attempt never wipes the fields — React resets
  // uncontrolled inputs when a form action completes.
  const [values, setValues] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const update =
    (name: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [name]: e.target.value }));

  const [state, formAction, pending] = React.useActionState<
    State | undefined,
    FormData
  >(async () => {
    const parsed = changePasswordSchema.safeParse(values);
    if (!parsed.success) {
      return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }

    try {
      await changePassword(
        parsed.data.currentPassword,
        parsed.data.newPassword,
      );
      // Success kills every session including this one (docs/auth.md) — the
      // login page explains what happened via ?reason=.
      router.replace("/login?reason=password-changed");
      return undefined;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401 && !error.fieldErrors) {
          return { fieldErrors: { currentPassword: [error.message] } };
        }
        return {
          formError: error.message,
          fieldErrors: error.fieldErrors,
        };
      }
      return { formError: "Something went wrong. Please try again." };
    }
  }, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>
          Changing it signs you out of every device, including this one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state?.formError && (
          <FormAlert className="mb-4">{state.formError}</FormAlert>
        )}

        <form className="space-y-4" action={formAction}>
          <div className="space-y-1.5">
            <label
              htmlFor="current-password"
              className="text-sm font-medium"
            >
              Current password
            </label>
            <PasswordInput
              id="current-password"
              name="currentPassword"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={values.currentPassword}
              onChange={update("currentPassword")}
            />
            <FieldError messages={state?.fieldErrors?.currentPassword} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-sm font-medium">
              New password
            </label>
            <PasswordInput
              id="new-password"
              name="newPassword"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={values.newPassword}
              onChange={update("newPassword")}
            />
            <FieldError messages={state?.fieldErrors?.newPassword} />
            <p className="text-xs text-muted-foreground">
              8+ characters with an uppercase letter, a lowercase letter, a
              digit and one of @ $ ! % * ? &
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm-new-password"
              className="text-sm font-medium"
            >
              Confirm new password
            </label>
            <PasswordInput
              id="confirm-new-password"
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

          <Button type="submit" disabled={pending}>
            {pending ? "Changing…" : "Change password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
