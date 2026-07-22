"use client";

import * as React from "react";
import Link from "next/link";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />
        }
      >
        <MenuIcon className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="sr-only">{siteConfig.name}</SheetTitle>
          <Logo className="h-12" onClick={() => setOpen(false)} />
        </SheetHeader>
        <nav className="flex flex-col px-2">
          {siteConfig.mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-lg px-2 py-2.5 text-base font-medium hover:bg-muted",
                item.highlight ? "text-brand" : "text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
          <Separator className="my-3" />
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-2.5 text-base font-medium text-foreground hover:bg-muted"
          >
            Sign in
          </Link>
          <Link
            href="/account/orders"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-2.5 text-base font-medium text-foreground hover:bg-muted"
          >
            Track your order
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
