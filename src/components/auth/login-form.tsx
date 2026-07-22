"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/auth/password-input";
import { AuthDivider, SocialButtons } from "@/components/auth/social-buttons";

export function LoginForm() {
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

        <form
          className="space-y-4"
          onSubmit={(e) => e.preventDefault()} // TODO: wire to auth API
        >
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
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="size-4 accent-brand"
            />
            Keep me signed in
          </label>

          <Button type="submit" className="h-11 w-full text-base">
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          New to Fashion Legacy?{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
