import Link from "next/link";
import { HeartIcon, SearchIcon, ShoppingBagIcon, UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50">
      <p className="bg-primary px-4 py-1.5 text-center text-xs text-primary-foreground">
        Cash on Delivery nationwide · Free delivery inside Dhaka on orders over
        ৳2,000
      </p>

      <div className="border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 md:h-20">
          <MobileNav />

          <Logo priority className="h-12 md:h-16" />

          <nav className="ml-8 hidden items-center gap-6 md:flex">
            {siteConfig.mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-brand",
                  item.highlight ? "text-brand" : "text-foreground/80"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <form action="/search" className="relative hidden lg:block">
              <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                name="q"
                placeholder="Search for kurti, panjabi, saree…"
                className="w-64 rounded-full border-transparent bg-muted pl-9"
              />
            </form>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Search"
            >
              <SearchIcon className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Wishlist"
              render={<Link href="/wishlist" />}
            >
              <HeartIcon className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cart"
              render={<Link href="/cart" />}
            >
              <ShoppingBagIcon className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Account"
              render={<Link href="/login" />}
            >
              <UserIcon className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
