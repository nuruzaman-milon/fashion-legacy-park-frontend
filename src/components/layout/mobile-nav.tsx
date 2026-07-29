"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  MenuIcon,
} from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
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
import type { ResolvedNavItem } from "@/lib/api/nav";
import { cn } from "@/lib/utils";

type MegaItem = ResolvedNavItem & {
  panel: NonNullable<ResolvedNavItem["panel"]>;
};

/**
 * Two-level drill-down menu: the root screen lists top-level entries only;
 * tapping a category slides to a detail screen with its links as compact
 * chips, grouped by section. Keeps every screen short and scannable.
 */
export function MobileNav({ items }: { items: ResolvedNavItem[] }) {
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const { status, logout } = useAuth();

  const close = () => setOpen(false);
  const activeItem = items.find(
    (item): item is MegaItem => item.panel !== undefined && item.label === view
  );

  const slide = (from: number) =>
    reduceMotion
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
      : {
          initial: { x: from, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: from, opacity: 0 },
        };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setView(null);
      }}
    >
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
          <Logo className="h-12" onClick={close} />
        </SheetHeader>

        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            {activeItem ? (
              <motion.div
                key={activeItem.label}
                {...slide(28)}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="h-full overflow-y-auto px-4 pb-6"
              >
                <button
                  type="button"
                  onClick={() => setView(null)}
                  className="flex items-center gap-1.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeftIcon className="size-4" />
                  Main menu
                </button>

                <Link
                  href={activeItem.href}
                  onClick={close}
                  className="mt-1 flex items-center justify-between rounded-xl bg-muted/70 px-4 py-3.5"
                >
                  <span className="font-heading text-lg font-medium">
                    Shop all {activeItem.label}
                  </span>
                  <ArrowRightIcon className="size-4 text-brand" />
                </Link>

                {activeItem.panel.columns.map((column) => (
                  <div key={column.title} className="mt-6">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      {column.title}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {column.links.map((link) => (
                        <Link
                          key={link.label}
                          href={link.href}
                          onClick={close}
                          className="rounded-full border border-border bg-background px-3.5 py-1.5 text-sm text-foreground/85 transition-colors active:bg-muted"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="root"
                {...slide(-28)}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="h-full overflow-y-auto px-2 pb-6"
              >
                <nav className="flex flex-col">
                  {items.map((item) =>
                    item.panel ? (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setView(item.label)}
                        className="flex items-center justify-between rounded-lg px-2 py-3 text-base font-medium text-foreground hover:bg-muted"
                      >
                        {item.label}
                        <ChevronRightIcon className="size-4 text-muted-foreground" />
                      </button>
                    ) : (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={close}
                        className={cn(
                          "rounded-lg px-2 py-3 text-base font-medium hover:bg-muted",
                          item.highlight ? "text-brand" : "text-foreground"
                        )}
                      >
                        {item.label}
                      </Link>
                    )
                  )}
                </nav>
                <Separator className="my-3" />
                {status === "authenticated" ? (
                  <>
                    <Link
                      href="/account"
                      onClick={close}
                      className="block rounded-lg px-2 py-3 text-base font-medium text-foreground hover:bg-muted"
                    >
                      My account
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        void logout();
                      }}
                      className="block w-full rounded-lg px-2 py-3 text-left text-base font-medium text-foreground hover:bg-muted"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={close}
                    className="block rounded-lg px-2 py-3 text-base font-medium text-foreground hover:bg-muted"
                  >
                    Sign in
                  </Link>
                )}
                <Link
                  href="/account/orders"
                  onClick={close}
                  className="block rounded-lg px-2 py-3 text-base font-medium text-foreground hover:bg-muted"
                >
                  Track your order
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
