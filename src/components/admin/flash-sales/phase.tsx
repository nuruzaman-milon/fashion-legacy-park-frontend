import { Badge } from "@/components/ui/badge";
import type { AdminFlashSale } from "@/lib/api/admin/flash-sales";

/**
 * Where a sale sits relative to now. "off" (isActive = false) trumps the
 * window — a disabled sale never serves, whatever its dates say.
 */
export type SalePhase = "live" | "scheduled" | "ended" | "off";

export function phaseOf(
  sale: Pick<AdminFlashSale, "isActive" | "startsAt" | "endsAt">,
  now: number,
): SalePhase {
  if (!sale.isActive) return "off";
  if (now < Date.parse(sale.startsAt)) return "scheduled";
  if (now < Date.parse(sale.endsAt)) return "live";
  return "ended";
}

const LOOKS: Record<SalePhase, { label: string; className: string }> = {
  live: {
    label: "Live",
    className:
      "border-emerald-600/25 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  },
  scheduled: {
    label: "Scheduled",
    className:
      "border-sky-600/25 bg-sky-600/10 text-sky-700 dark:text-sky-400",
  },
  ended: { label: "Ended", className: "text-muted-foreground" },
  off: { label: "Disabled", className: "text-muted-foreground" },
};

export function PhaseBadge({ phase }: { phase: SalePhase }) {
  const look = LOOKS[phase];
  return (
    <Badge variant="outline" className={look.className}>
      {look.label}
    </Badge>
  );
}
