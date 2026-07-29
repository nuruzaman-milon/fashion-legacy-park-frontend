import type { Metadata } from "next";

import { CheckoutView } from "@/components/checkout/checkout-view";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Complete your Fashion Legacy order — Cash on Delivery, bKash and cards accepted, delivered across Bangladesh.",
};

// The cart is account-scoped and fetched client-side (docs/cart.md).
export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <CheckoutView />
    </div>
  );
}
