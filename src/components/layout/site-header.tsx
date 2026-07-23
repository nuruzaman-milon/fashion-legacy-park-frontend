import Link from "next/link";
import { HeartIcon, SearchIcon, ShoppingBagIcon, UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getNavMenu } from "@/lib/api/nav";
import { cn } from "@/lib/utils";

const headerIconHover =
  "hover:bg-[oklch(0.88_0.06_80/0.5)] hover:text-brand";

export async function SiteHeader() {
  const navItems = await getNavMenu();

  return (
    <header className="sticky top-0 z-50">
      <p className="bg-primary px-4 py-1.5 text-center text-xs text-primary-foreground">
        Cash on Delivery nationwide · Free delivery inside Dhaka on orders over
        ৳2,000
      </p>

      <div
        id="site-header-bar"
        className="border-b border-[oklch(0.88_0.04_82/0.8)] backdrop-blur"
        style={{
          background:
            "radial-gradient(52rem 7rem at 80% 0%, oklch(0.88 0.075 80 / 0.4), transparent 68%), linear-gradient(115deg, oklch(0.96 0.03 86 / 0.94), oklch(0.975 0.014 84 / 0.9) 55%, oklch(0.955 0.035 82 / 0.94))",
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 md:h-20">
          <MobileNav />

          <Logo priority className="h-12 md:h-16" />

          <DesktopNav items={navItems} />

          <div className="ml-auto flex items-center gap-1">
            <form action="/search" className="relative hidden lg:block">
              <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                name="q"
                placeholder="Search for kurti, panjabi, saree…"
                className="w-64 rounded-full border-[oklch(0.85_0.05_80)] bg-muted pl-9"
              />
            </form>
            <Button
              variant="ghost"
              size="icon"
              className={cn("lg:hidden", headerIconHover)}
              aria-label="Search"
            >
              <SearchIcon className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={headerIconHover}
              aria-label="Wishlist"
              render={<Link href="/wishlist" />}
            >
              <HeartIcon className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={headerIconHover}
              aria-label="Cart"
              render={<Link href="/cart" />}
            >
              <ShoppingBagIcon className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={headerIconHover}
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
