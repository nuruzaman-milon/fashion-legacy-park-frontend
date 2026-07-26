import type { Metadata } from "next";

import { WishlistView } from "@/components/wishlist/wishlist-view";
import { getWishlist } from "@/lib/api/wishlist";

export const metadata: Metadata = {
  title: "Wishlist",
  description:
    "Your saved styles at Fashion Legacy — keep favourites for later and add them to your cart when you're ready.",
};

export default async function WishlistPage() {
  const items = await getWishlist();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <WishlistView initialItems={items} />
    </div>
  );
}
