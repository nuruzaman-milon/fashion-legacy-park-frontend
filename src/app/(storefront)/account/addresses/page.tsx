import type { Metadata } from "next";

import { AddressesView } from "@/components/account/addresses-view";

export const metadata: Metadata = { title: "My addresses" };

export default function AccountAddressesPage() {
  return <AddressesView />;
}
