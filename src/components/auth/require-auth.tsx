"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";

/**
 * Client-side gate for account pages. UX only — real enforcement is the
 * backend's Bearer check on every request; this keeps anonymous visitors out
 * of empty shells and remembers where they were headed via ?next=.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div
          aria-label="Loading"
          className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent"
        />
      </div>
    );
  }
  return <>{children}</>;
}
