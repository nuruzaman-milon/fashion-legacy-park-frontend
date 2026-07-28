import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";
import { getCart } from "@/lib/api/cart";

export const metadata: Metadata = {
  title: "Shopping cart",
  description:
    "Review your picks and check out — Cash on Delivery, bKash and cards accepted, delivered across Bangladesh.",
};

export default async function CartPage() {
  const lines = await getCart();

  return (
    <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 sm:py-10">
      <CartView initialLines={lines} />
    </div>
  );
}
