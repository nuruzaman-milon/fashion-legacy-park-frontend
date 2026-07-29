import type { Metadata } from "next";

import { WishlistView } from "@/components/wishlist/wishlist-view";

export const metadata: Metadata = {
  title: "Wishlist",
  description:
    "Your saved styles at Fashion Legacy — keep favourites for later and add them to your cart when you're ready.",
};

// Account-scoped, fetched client-side with the Bearer token (docs/cart.md).
export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 sm:py-10">
      <WishlistView />
    </div>
  );
}
