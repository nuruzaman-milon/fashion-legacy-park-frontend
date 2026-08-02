"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as z from "zod";

import { useAuth } from "@/components/auth/auth-provider";
import { FieldError } from "@/components/auth/field-error";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { ResendVerification } from "@/components/auth/resend-verification";
import { AuthDivider, SocialButtons } from "@/components/auth/social-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { loginSchema } from "@/lib/auth/validation";

interface LoginState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  unverifiedEmail?: string;
}

/**
 * Where to go after signing in. Only same-site paths are honoured so a
 * crafted ?next=https://evil.example link cannot bounce users off-site.
 * Without a ?next=, sellers land in their portal — the storefront's account
 * area has nothing for them.
 */
function safeNext(role?: string): string {
  const next = new URLSearchParams(window.location.search).get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return role === "SELLER" ? "/seller" : "/";
}

// ?reason= read via useSyncExternalStore: null on the server, the query value
// after hydration — no effect, no mismatch.
const noopSubscribe = () => () => {};
const readReason = () =>
  new URLSearchParams(window.location.search).get("reason");

export function LoginForm() {
  const { status, user, login } = useAuth();
  const router = useRouter();

  // Already signed in (bootstrap or another tab) — this page has no purpose.
  React.useEffect(() => {
    if (status === "authenticated") router.replace(safeNext(user?.role));
  }, [status, user, router]);

  // Flows that kill the session (change password) land here with a ?reason=
  // so the fresh login isn't a mystery.
  const reason = React.useSyncExternalStore(
    noopSubscribe,
    readReason,
    () => null,
  );
  const notice =
    reason === "password-changed"
      ? "Password changed. Every device was signed out — sign in with your new password."
      : null;

  // Controlled so a failed attempt never wipes what the user typed — React
  // resets uncontrolled fields when a form action completes.
  const [values, setValues] = React.useState({ email: "", password: "" });
  const update =
    (name: "email" | "password") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [name]: e.target.value }));

  const [state, formAction, pending] = React.useActionState<
    LoginState | undefined,
    FormData
  >(async () => {
    const parsed = loginSchema.safeParse({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    });
    if (!parsed.success) {
      return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }

    try {
      const loggedIn = await login(parsed.data.email, parsed.data.password);
      router.replace(safeNext(loggedIn.role));
      return undefined;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "EMAIL_NOT_VERIFIED") {
          return { unverifiedEmail: parsed.data.email };
        }
        if (error.code === "ACCOUNT_DEACTIVATED") {
          return {
            formError:
              "This account has been deactivated. Please contact support if you believe this is a mistake.",
          };
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
    <div>
      <h1 className="font-heading text-2xl font-medium tracking-tight sm:text-3xl">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to see your orders, cart and wishlist.
      </p>

      <div className="mt-8 space-y-5">
        <SocialButtons />
        <AuthDivider />

        {notice && <FormAlert tone="success">{notice}</FormAlert>}

        {state?.unverifiedEmail && (
          <FormAlert tone="info">
            <p className="font-medium">Verify your email first</p>
            <p className="mt-1 text-muted-foreground">
              We sent a link to <strong>{state.unverifiedEmail}</strong> when
              you registered. Click it, then sign in. Lost it?
            </p>
            <ResendVerification
              email={state.unverifiedEmail}
              className="mt-3"
            />
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
              value={values.email}
              onChange={update("email")}
            />
            <FieldError messages={state?.fieldErrors?.email} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-brand hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={values.password}
              onChange={update("password")}
            />
            <FieldError messages={state?.fieldErrors?.password} />
          </div>

          <Button
            type="submit"
            className="h-11 w-full text-base"
            disabled={pending}
          >
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          New to Fashion Legacy?{" "}
          <Link
            href="/register"
            className="font-medium text-brand hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
