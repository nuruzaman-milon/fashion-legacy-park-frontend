"use client";

import Link from "next/link";
import { HeartIcon, ShoppingBagIcon } from "lucide-react";

import { useShop } from "@/components/shop/shop-provider";
import { Button } from "@/components/ui/button";

/**
 * Header wishlist/cart icons with live count bubbles from the shared shop
 * state — counts move instantly on optimistic updates, before the backend
 * confirms. No bubble when signed out or empty.
 */

function CountBubble({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span
      aria-hidden
      className="absolute -top-2 -right-2 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground tabular-nums"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function WishlistButton({ className }: { className?: string }) {
  const { wishlistCount } = useShop();
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={
        wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : "Wishlist"
      }
      render={<Link href="/wishlist" />}
    >
      <span className="relative">
        <HeartIcon className="size-5" />
        <CountBubble count={wishlistCount} />
      </span>
    </Button>
  );
}

export function CartButton({ className }: { className?: string }) {
  const { cartCount } = useShop();
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
      render={<Link href="/cart" />}
    >
      <span className="relative">
        <ShoppingBagIcon className="size-5" />
        <CountBubble count={cartCount} />
      </span>
    </Button>
  );
}
