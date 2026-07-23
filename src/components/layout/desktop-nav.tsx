"use client";

import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu";
import { ProductThumb } from "@/components/product/product-thumb";
import type { ResolvedNavItem } from "@/lib/api/nav";
import { cn } from "@/lib/utils";

type Panel = NonNullable<ResolvedNavItem["panel"]>;

function MegaPanel({ label, href, panel }: { label: string; href: string; panel: Panel }) {
  return (
    <div>
      <div className="flex w-[min(72rem,calc(100vw-4rem))] gap-10 px-8 py-6 lg:gap-12">
        {panel.columns.map((column) => (
          <div key={column.title} className="min-w-36">
            <p className="text-sm font-semibold tracking-[0.08em] text-brand uppercase">
              {column.title}
            </p>
            <ul className="mt-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <NavigationMenuLink
                    closeOnClick
                    render={<Link href={link.href} />}
                    className="block py-1.5 text-sm text-foreground/80 transition-colors hover:text-brand"
                  >
                    {link.label}
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {panel.newArrivals.length > 0 && (
          <div className="ml-auto hidden w-80 shrink-0 border-l border-border pl-8 lg:block">
            <p className="text-sm font-semibold tracking-[0.08em] text-brand uppercase">
              New Arrivals
            </p>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4">
              {panel.newArrivals.map((product) => (
                <NavigationMenuLink
                  key={product.id}
                  closeOnClick
                  render={<Link href={`/products/${product.slug}`} />}
                  className="group block"
                >
                  <ProductThumb
                    title={product.title}
                    image={product.image}
                    seed={product.slug}
                    className="aspect-square w-full rounded-lg"
                    sizes="140px"
                  />
                  <p className="mt-1.5 truncate text-xs text-foreground/80 transition-colors group-hover:text-brand">
                    {product.title}
                  </p>
                </NavigationMenuLink>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border bg-muted/60 px-8 py-3">
        <NavigationMenuLink
          closeOnClick
          render={<Link href={href} />}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-opacity hover:opacity-80"
        >
          View All {label}
          <ArrowRightIcon className="size-4" />
        </NavigationMenuLink>
      </div>
    </div>
  );
}

export function DesktopNav({ items }: { items: ResolvedNavItem[] }) {
  return (
    <NavigationMenu className="ml-8 hidden md:block">
      <NavigationMenuList>
        {items.map((item) =>
          item.panel ? (
            <NavigationMenuItem key={item.label} value={item.label}>
              <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <MegaPanel label={item.label} href={item.href} panel={item.panel} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={item.label}>
              <NavigationMenuLink
                render={<Link href={item.href} />}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-brand",
                  item.highlight ? "text-brand" : "text-foreground/80"
                )}
              >
                {item.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          )
        )}
      </NavigationMenuList>
      <NavigationMenuViewport
        anchor={() => document.getElementById("site-header-bar")}
        sideOffset={0}
        collisionPadding={0}
      />
    </NavigationMenu>
  );
}
