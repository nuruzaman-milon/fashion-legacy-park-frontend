import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * KPI tile: label · value · optional signed delta vs a named period. The value
 * stays in the sans face with proportional figures (dataviz stat-tile
 * contract — the serif heading font would read as decoration here).
 */
export function StatTile({
  label,
  value,
  deltaPct,
  deltaPeriod = "vs previous 30 days",
  hint,
}: {
  label: string;
  value: string;
  /** Signed percentage; positive renders as good (up = good for every KPI here). */
  deltaPct?: number;
  deltaPeriod?: string;
  /** Muted context line used when there is no delta (e.g. "9 drafts"). */
  hint?: string;
}) {
  const up = deltaPct !== undefined && deltaPct >= 0;
  return (
    <Card size="sm" className="gap-1.5">
      <p className="px-(--card-spacing) text-sm text-muted-foreground">
        {label}
      </p>
      <p className="px-(--card-spacing) text-2xl font-semibold tracking-tight">
        {value}
      </p>
      {deltaPct !== undefined ? (
        <p className="flex items-center gap-1 px-(--card-spacing) text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              up
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-destructive",
            )}
          >
            {up ? (
              <ArrowUpRightIcon className="size-3.5" />
            ) : (
              <ArrowDownRightIcon className="size-3.5" />
            )}
            {up ? "+" : ""}
            {deltaPct.toFixed(1)}%
          </span>
          {deltaPeriod}
        </p>
      ) : hint ? (
        <p className="px-(--card-spacing) text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </Card>
  );
}
