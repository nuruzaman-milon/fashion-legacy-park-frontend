"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthDivider, SocialButtons } from "@/components/auth/social-buttons";

export function RegisterForm() {
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

        <form
          className="space-y-4"
          onSubmit={(e) => e.preventDefault()} // TODO: wire to auth API
        >
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
            />
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
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll send a verification link to this address.
            </p>
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
              placeholder="+880 1XXX-XXXXXX"
              className="h-10"
            />
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
            />
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
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="terms"
              required
              className="mt-0.5 size-4 accent-brand"
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

          <Button type="submit" className="h-11 w-full text-base">
            Create account
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
