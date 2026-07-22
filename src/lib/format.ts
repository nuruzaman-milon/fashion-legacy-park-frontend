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
