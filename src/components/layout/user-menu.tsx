"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOutIcon, UserIcon, UserRoundIcon } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Header account button. Anonymous: a link to /login. Authenticated: an
 * initials badge opening the account menu. While the session bootstrap is
 * still resolving it renders a disabled icon rather than the login link, so
 * a click during that beat cannot navigate a logged-in user to /login.
 */
export function UserMenu({ className }: { className?: string }) {
  const { status, user, logout } = useAuth();
  const router = useRouter();

  if (status !== "authenticated" || !user) {
    const loading = status === "loading";
    return (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        aria-label="Account"
        disabled={loading}
        render={loading ? undefined : <Link href="/login" />}
    >
        <UserIcon className="size-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={className}
            aria-label="Account menu"
          />
        }
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
          {initialsOf(user.name)}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <span className="block truncate font-medium">{user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLinkItem render={<Link href="/account" />}>
          <UserRoundIcon className="size-4" />
          My account
        </DropdownMenuLinkItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            void logout().then(() => router.push("/"));
          }}
        >
          <LogOutIcon className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
