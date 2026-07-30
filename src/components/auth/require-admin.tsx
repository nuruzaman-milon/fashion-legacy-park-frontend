"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldXIcon } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

/**
 * Client-side gate for the admin area. UX only — real enforcement is the
 * backend's role check on every admin endpoint; this keeps non-admins out of
 * empty shells. Anonymous visitors bounce to /login with a ?next= return path;
 * signed-in customers get an access-denied screen instead of a redirect loop.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div
          aria-label="Loading"
          className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent"
        />
      </div>
    );
  }

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  if (!isAdmin) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldXIcon className="size-6" />
        </span>
        <div className="space-y-1">
          <h1 className="font-heading text-xl font-medium">
            This area is for administrators
          </h1>
          <p className="text-sm text-muted-foreground">
            Your account ({user?.email}) doesn&apos;t have admin access.
          </p>
        </div>
        <Button render={<Link href="/" />}>Back to the store</Button>
      </div>
    );
  }

  return <>{children}</>;
}
