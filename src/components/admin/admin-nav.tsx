"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderTreeIcon,
  ImagesIcon,
  LayersIcon,
  LayoutDashboardIcon,
  MessageCircleIcon,
  PackageIcon,
  ShoppingBagIcon,
  SparklesIcon,
  StarIcon,
  StoreIcon,
  TagIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Backend module not built yet — rendered inert with a "Soon" badge. */
  soon?: boolean;
}

/** Grouped to mirror the backend's admin modules (see docs/admin.md). */
const NAV_GROUPS: { label: string | null; items: AdminNavItem[] }[] = [
  {
    label: null,
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon }],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: PackageIcon },
      { href: "/admin/categories", label: "Categories", icon: FolderTreeIcon },
      { href: "/admin/brands", label: "Brands", icon: TagIcon },
      { href: "/admin/options", label: "Options", icon: LayersIcon },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/admin/banners", label: "Banners", icon: ImagesIcon },
      { href: "/admin/flash-sales", label: "Flash sales", icon: SparklesIcon },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBagIcon },
      { href: "/admin/reviews", label: "Reviews", icon: StarIcon },
      { href: "/admin/chats", label: "Chats", icon: MessageCircleIcon },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: UsersIcon },
      { href: "/admin/sellers", label: "Sellers", icon: StoreIcon },
    ],
  },
];

/**
 * The admin nav list — shared between the desktop sidebar and the mobile
 * drawer. `onNavigate` lets the drawer close itself after a link click.
 */
export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex flex-col gap-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label ?? "root"} className="flex flex-col gap-0.5">
          {group.label && (
            <p className="px-3 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground/80 uppercase">
              {group.label}
            </p>
          )}
          {group.items.map(({ href, label, icon: Icon, soon }) => {
            if (soon) {
              return (
                <span
                  key={href}
                  aria-disabled
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/60 select-none"
                >
                  <Icon className="size-4" />
                  {label}
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    Soon
                  </Badge>
                </span>
              );
            }
            const active =
              href === "/admin"
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
        </div>
      ))}
    </nav>
  );
}
