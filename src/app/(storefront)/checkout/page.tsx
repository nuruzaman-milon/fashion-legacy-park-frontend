import type { Metadata } from "next";

import { CheckoutView } from "@/components/checkout/checkout-view";
import { getCart } from "@/lib/api/cart";

export const metadata: Metadata = {
  title: "Checkout",
  description:
    "Complete your Fashion Legacy order — Cash on Delivery, bKash and cards accepted, delivered across Bangladesh.",
};

export default async function CheckoutPage() {
  const lines = await getCart();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <CheckoutView lines={lines} />
    </div>
  );
}
