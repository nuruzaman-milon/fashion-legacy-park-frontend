"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLinkIcon, PanelLeftIcon } from "lucide-react";

import { SellerNav } from "@/components/seller/seller-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";

function SellerBrand() {
  return (
    <Link href="/seller" className="flex items-baseline gap-2 px-3">
      <span className="font-heading text-lg font-medium tracking-tight">
        {siteConfig.name}
      </span>
      <span className="rounded-md bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-brand uppercase">
        Seller
      </span>
    </Link>
  );
}

/**
 * Chrome for every seller-portal page — the AdminShell layout with the
 * seller nav and no notifications bell (no seller-facing notifications are
 * emitted yet).
 */
export function SellerShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <div className="flex w-full flex-1">
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col gap-6 overflow-y-auto border-r border-border bg-card py-5 lg:flex">
        <SellerBrand />
        <div className="flex-1 px-2">
          <SellerNav />
        </div>
        <div className="px-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 px-3 text-muted-foreground"
            render={<Link href="/" target="_blank" />}
          >
            <ExternalLinkIcon className="size-4" />
            View store
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur-sm sm:px-6">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open seller menu"
                />
              }
            >
              <PanelLeftIcon className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 gap-0">
              <SheetHeader className="pb-2">
                <SheetTitle>
                  {siteConfig.name}{" "}
                  <span className="text-xs font-semibold tracking-wider text-brand uppercase">
                    Seller
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto px-2 pb-4">
                <SellerNav onNavigate={() => setDrawerOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="View store"
              render={<Link href="/" target="_blank" />}
            >
              <ExternalLinkIcon className="size-4" />
            </Button>
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
