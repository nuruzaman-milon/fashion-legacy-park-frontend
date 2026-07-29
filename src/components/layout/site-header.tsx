import { Suspense } from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CartButton, WishlistButton } from "@/components/layout/header-shop-buttons";
import { DesktopNav, DesktopNavFallback } from "@/components/layout/desktop-nav";
import { SearchBox } from "@/components/layout/search-box";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
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
        <div className="mx-auto flex h-16 max-w-8xl items-center gap-2 px-4 sm:px-6 md:h-20">
          <MobileNav items={navItems} />

          <Logo priority className="h-12 md:h-16" />

          <Suspense fallback={<DesktopNavFallback items={navItems} />}>
            <DesktopNav items={navItems} />
          </Suspense>

          <div className="ml-auto flex items-center gap-1">
            <div className="hidden lg:block">
              <SearchBox />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn("lg:hidden", headerIconHover)}
              aria-label="Search"
              render={<Link href="/search" />}
            >
              <SearchIcon className="size-5" />
            </Button>
            <WishlistButton className={headerIconHover} />
            <CartButton className={headerIconHover} />
            <UserMenu className={headerIconHover} />
          </div>
        </div>
      </div>
    </header>
  );
}
