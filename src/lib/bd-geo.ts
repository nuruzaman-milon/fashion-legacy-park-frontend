/**
 * The delivery areas the store serves, shared by checkout and the saved
 * address book so a saved district always matches what checkout expects.
 * `value` is the canonical slug stored in Address.district and used for the
 * inside/outside-Dhaka shipping split.
 */
export const DISTRICTS = [
  { value: "dhaka", label: "Dhaka" },
  { value: "gazipur", label: "Gazipur" },
  { value: "narayanganj", label: "Narayanganj" },
  { value: "chattogram", label: "Chattogram" },
  { value: "coxs-bazar", label: "Cox's Bazar" },
  { value: "cumilla", label: "Cumilla" },
  { value: "sylhet", label: "Sylhet" },
  { value: "rajshahi", label: "Rajshahi" },
  { value: "khulna", label: "Khulna" },
  { value: "barishal", label: "Barishal" },
  { value: "rangpur", label: "Rangpur" },
  { value: "mymensingh", label: "Mymensingh" },
];

/** Mirrors the backend's map — the Address model wants a division too. */
export const DIVISION_OF: Record<string, string> = {
  dhaka: "Dhaka",
  gazipur: "Dhaka",
  narayanganj: "Dhaka",
  chattogram: "Chattogram",
  "coxs-bazar": "Chattogram",
  cumilla: "Chattogram",
  sylhet: "Sylhet",
  rajshahi: "Rajshahi",
  khulna: "Khulna",
  barishal: "Barishal",
  rangpur: "Rangpur",
  mymensingh: "Mymensingh",
};

export function districtLabel(slug: string): string {
  return (
    DISTRICTS.find((d) => d.value === slug)?.label ??
    slug.charAt(0).toUpperCase() + slug.slice(1)
  );
}
