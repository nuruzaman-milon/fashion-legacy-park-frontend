// Bangladesh uses lakh/crore digit grouping (1,20,000), which en-IN matches.
const bdNumber = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatPrice(amount: number): string {
  return `৳${bdNumber.format(amount)}`;
}

export function formatPriceRange(min: number, max: number): string {
  return min === max
    ? formatPrice(min)
    : `${formatPrice(min)} – ${formatPrice(max)}`;
}

export function discountPercent(price: number, comparePrice: number): number {
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

const bdDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDate(iso: string): string {
  return bdDate.format(new Date(iso));
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "just now" / "5 minutes ago" / "2 days ago", falling back to the date. */
export function formatRelativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return relative.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return relative.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 30) return relative.format(-days, "day");
  return formatDate(iso);
}
