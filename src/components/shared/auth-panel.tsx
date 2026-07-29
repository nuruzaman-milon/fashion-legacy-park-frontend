"use client";

import Link from "next/link";
import { ArrowRightIcon, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Centered spinner for client views waiting on session or data. */
export function PanelLoading({ label }: { label: string }) {
  return (
    <div className="mt-8 flex min-h-[40vh] items-center justify-center">
      <div
        aria-label={label}
        className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent"
      />
    </div>
  );
}

/**
 * Friendly gate for login-only pages (cart, wishlist): invites sign-in
 * instead of bouncing, and returns the visitor here via ?next=.
 */
export function SignInPrompt({
  icon: Icon,
  title,
  copy,
  nextPath,
}: {
  icon: LucideIcon;
  title: string;
  copy: string;
  nextPath: string;
}) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed px-6 py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent/70">
        <Icon className="size-6 text-brand" />
      </span>
      <p className="font-heading mt-4 text-xl font-medium">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{copy}</p>
      <Button
        className="mt-6"
        render={<Link href={`/login?next=${encodeURIComponent(nextPath)}`} />}
      >
        Sign in
        <ArrowRightIcon />
      </Button>
    </div>
  );
}
