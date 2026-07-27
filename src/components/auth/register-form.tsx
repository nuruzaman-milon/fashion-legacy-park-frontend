"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as z from "zod";

import { FieldError } from "@/components/auth/field-error";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthDivider, SocialButtons } from "@/components/auth/social-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register as registerApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { normalizePhone, registerSchema } from "@/lib/auth/validation";

interface RegisterState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  emailTaken?: boolean;
}

export function RegisterForm() {
  const router = useRouter();

  // Controlled on purpose: React resets a form's uncontrolled fields when a
  // form action completes, wiping what the user typed on every failed
  // attempt. Controlled values survive any error and only die with the page.
  const [values, setValues] = React.useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const update =
    (name: "name" | "email" | "phone" | "password" | "confirmPassword") =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [name]: e.target.value }));

  const [state, formAction, pending] = React.useActionState<
    RegisterState | undefined,
    FormData
  >(async () => {
    const parsed = registerSchema.safeParse({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim()
        ? normalizePhone(values.phone.trim())
        : undefined,
      password: values.password,
      confirmPassword: values.confirmPassword,
    });
    if (!parsed.success) {
      return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }

    try {
      await registerApi({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        phone: parsed.data.phone,
      });
      router.replace(
        `/check-email?email=${encodeURIComponent(parsed.data.email)}`,
      );
      return undefined;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          return {
            emailTaken: true,
            fieldErrors: { email: [error.message] },
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
        Create your account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Join Fashion Legacy — save your cart, track orders and check out
        faster.
      </p>

      <div className="mt-8 space-y-5">
        <SocialButtons />
        <AuthDivider />

        {state?.formError && <FormAlert>{state.formError}</FormAlert>}

        <form className="space-y-4" action={formAction}>
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              Full name
            </label>
            <Input
              id="name"
              name="name"
              required
              autoComplete="name"
              placeholder="Ayesha Rahman"
              className="h-10"
              value={values.name}
              onChange={update("name")}
            />
            <FieldError messages={state?.fieldErrors?.name} />
          </div>

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
            {state?.emailTaken ? (
              <p className="text-xs text-muted-foreground">
                Already yours?{" "}
                <Link
                  href="/login"
                  className="font-medium text-brand hover:underline"
                >
                  Sign in instead
                </Link>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                We&apos;ll send a verification link to this address.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="01712345678"
              className="h-10"
              value={values.phone}
              onChange={update("phone")}
            />
            <FieldError messages={state?.fieldErrors?.phone} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
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
              Confirm password
            </label>
            <PasswordInput
              id="confirm-password"
              name="confirmPassword"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={values.confirmPassword}
              onChange={update("confirmPassword")}
            />
            <FieldError messages={state?.fieldErrors?.confirmPassword} />
          </div>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="terms"
              required
              className="mt-0.5 size-4 accent-brand"
              checked={values.terms}
              onChange={(e) =>
                setValues((v) => ({ ...v, terms: e.target.checked }))
              }
            />
            <span>
              I agree to the{" "}
              <Link
                href="/pages/terms"
                className="font-medium text-brand hover:underline"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/pages/privacy"
                className="font-medium text-brand hover:underline"
              >
                Privacy Policy
              </Link>
            </span>
          </label>

          <Button
            type="submit"
            className="h-11 w-full text-base"
            disabled={pending}
          >
            {pending ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
