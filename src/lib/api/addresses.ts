import { apiFetch } from "./client";
import { DIVISION_OF, districtLabel } from "@/lib/bd-geo";

/**
 * The customer's address book (`/addresses`, bearer). Exactly one default
 * per user, DB-enforced — checkout pre-selects it. `district` holds the
 * canonical slug from `bd-geo` so shipping math keeps working.
 */

export interface SavedAddress {
  id: string;
  receiverName: string;
  phone: string;
  /** "Home" / "Office" / "Others" — free text on the backend. */
  label: string | null;
  division: string;
  district: string;
  upazila: string;
  area: string | null;
  address: string;
  postalCode: string | null;
  isDefault: boolean;
  createdAt: string;
}

export async function listAddresses(): Promise<SavedAddress[]> {
  return apiFetch<SavedAddress[]>("/addresses");
}

export interface AddressPayload {
  receiverName: string;
  phone: string;
  label?: string;
  /** Canonical district slug; division/upazila are derived from it. */
  district: string;
  address: string;
  isDefault?: boolean;
}

/** The backend wants division + upazila too — derived from the district. */
function toApiBody(payload: AddressPayload) {
  return {
    receiverName: payload.receiverName,
    phone: payload.phone,
    ...(payload.label && { label: payload.label }),
    division: DIVISION_OF[payload.district] ?? districtLabel(payload.district),
    district: payload.district,
    upazila: districtLabel(payload.district),
    address: payload.address,
  };
}

export async function createAddress(
  payload: AddressPayload,
): Promise<SavedAddress> {
  return apiFetch<SavedAddress>("/addresses", {
    method: "POST",
    body: { ...toApiBody(payload), isDefault: payload.isDefault ?? false },
  });
}

export async function updateAddress(
  id: string,
  payload: AddressPayload,
): Promise<SavedAddress> {
  return apiFetch<SavedAddress>(`/addresses/${id}`, {
    method: "PATCH",
    body: toApiBody(payload),
  });
}

export async function setDefaultAddress(id: string): Promise<SavedAddress> {
  return apiFetch<SavedAddress>(`/addresses/${id}/default`, {
    method: "PATCH",
  });
}

export async function deleteAddress(id: string): Promise<void> {
  await apiFetch(`/addresses/${id}`, { method: "DELETE" });
}
