import {
  ShieldCheckIcon,
  StarIcon,
  TruckIcon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const STATS = [
  { icon: UsersIcon, value: "20K+", label: "Happy Customers" },
  { icon: StarIcon, value: "4.7", label: "Average Rating" },
  { icon: TruckIcon, value: "64", label: "Districts Delivered" },
  { icon: ShieldCheckIcon, value: "100%", label: "Secure Shopping" },
];

// Divider recipe per cell: 2-up grid on mobile, 4-up from lg.
const CELL_BORDERS = [
  "",
  "border-l",
  "max-lg:border-t lg:border-l",
  "border-l max-lg:border-t",
];

/** Slim gold-on-dark stat strip; sits on the hero's dark background. */
export function HeroStats() {
  return (
    <dl className="grid grid-cols-2 rounded-xl border border-white/10 lg:grid-cols-4">
      {STATS.map((stat, i) => (
        <div
          key={stat.label}
          className={cn(
            "flex items-center justify-center gap-2 border-white/10 px-3 py-2.5 sm:py-3",
            CELL_BORDERS[i]
          )}
        >
          <stat.icon
            aria-hidden
            strokeWidth={1.5}
            className="size-4 shrink-0 text-[oklch(0.82_0.09_75)]"
          />
          <dt className="sr-only">{stat.label}</dt>
          <dd className="font-heading text-sm font-medium text-[oklch(0.82_0.09_75)] sm:text-base">
            {stat.value}
          </dd>
          <dd className="text-xs text-background/65">{stat.label}</dd>
        </div>
      ))}
    </dl>
  );
}
