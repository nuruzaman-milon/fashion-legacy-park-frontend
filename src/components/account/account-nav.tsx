"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MonitorSmartphoneIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Profile", icon: UserRoundIcon },
  { href: "/account/security", label: "Security", icon: ShieldCheckIcon },
  { href: "/account/sessions", label: "Devices", icon: MonitorSmartphoneIcon },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account"
      className="flex gap-1 overflow-x-auto lg:flex-col"
    >
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
