import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Shopping cart",
  description:
    "Review your picks and check out — Cash on Delivery, bKash and cards accepted, delivered across Bangladesh.",
};

// The cart is account-scoped and fetched client-side with the Bearer token
// (docs/cart.md — no guest cart); the server renders only the shell.
export default function CartPage() {
  return (
    <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 sm:py-10">
      <CartView />
    </div>
  );
}
