"use client";

import * as React from "react";
import * as z from "zod";

import { useAuth } from "@/components/auth/auth-provider";
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
import { Input } from "@/components/ui/input";
import { changeEmail } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const changeEmailSchema = z.object({
  newEmail: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

interface State {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  /** Link sent — the address only changes once confirmed from that inbox. */
  sentTo?: string;
}

export function ChangeEmailForm() {
  const { user } = useAuth();

  // Controlled so a failed attempt never wipes the fields — React resets
  // uncontrolled inputs when a form action completes.
  const [values, setValues] = React.useState({ newEmail: "", password: "" });
  const update =
    (name: "newEmail" | "password") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [name]: e.target.value }));

  const [state, formAction, pending] = React.useActionState<
    State | undefined,
    FormData
  >(async () => {
    const parsed = changeEmailSchema.safeParse({
      newEmail: values.newEmail.trim().toLowerCase(),
      password: values.password,
    });
    if (!parsed.success) {
      return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }

    try {
      await changeEmail(parsed.data.newEmail, parsed.data.password);
      // The password did its job; no reason to keep it on screen.
      setValues((v) => ({ ...v, password: "" }));
      return { sentTo: parsed.data.newEmail };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401 && !error.fieldErrors) {
          return { fieldErrors: { password: [error.message] } };
        }
        if (error.status === 409) {
          return { fieldErrors: { newEmail: [error.message] } };
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
        <CardTitle>Change email</CardTitle>
        <CardDescription>
          Currently <strong>{user?.email}</strong>. We&apos;ll send a
          confirmation link to the new address — nothing changes until you
          click it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state?.sentTo && (
          <FormAlert tone="success" className="mb-4">
            Confirmation link sent to <strong>{state.sentTo}</strong>. Open
            that inbox and click the link — it stays valid for 24 hours.
          </FormAlert>
        )}
        {state?.formError && (
          <FormAlert className="mb-4">{state.formError}</FormAlert>
        )}

        <form className="space-y-4" action={formAction}>
          <div className="space-y-1.5">
            <label htmlFor="new-email" className="text-sm font-medium">
              New email
            </label>
            <Input
              id="new-email"
              name="newEmail"
              type="email"
              required
              autoComplete="email"
              placeholder="new@example.com"
              className="h-10"
              value={values.newEmail}
              onChange={update("newEmail")}
            />
            <FieldError messages={state?.fieldErrors?.newEmail} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email-password" className="text-sm font-medium">
              Your password
            </label>
            <PasswordInput
              id="email-password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={values.password}
              onChange={update("password")}
            />
            <FieldError messages={state?.fieldErrors?.password} />
            <p className="text-xs text-muted-foreground">
              Required so a stolen session can&apos;t move your account.
            </p>
          </div>

          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send confirmation link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
