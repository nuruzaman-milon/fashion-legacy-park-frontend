"use client";

import * as React from "react";
import {
  ShieldCheckIcon,
  StarIcon,
  TruckIcon,
  UsersIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

const TICK_MS = 3000;

const STATS = [
  { icon: UsersIcon, value: "20K+", label: "Happy Customers" },
  { icon: StarIcon, value: "4.7", label: "Average Rating" },
  { icon: TruckIcon, value: "64", label: "Districts Delivered" },
  { icon: ShieldCheckIcon, value: "100%", label: "Secure Shopping" },
];

function StatItem({ stat }: { stat: (typeof STATS)[number] }) {
  return (
    <>
      <stat.icon
        aria-hidden
        strokeWidth={1.5}
        className="size-4 shrink-0 text-[oklch(0.82_0.09_75)]"
      />
      <span className="font-heading text-sm font-medium text-[oklch(0.82_0.09_75)] sm:text-base">
        {stat.value}
      </span>
      <span className="text-xs text-background/65">{stat.label}</span>
    </>
  );
}

/**
 * Slim gold-on-dark stat strip on the hero. A 4-up row from `lg`; below
 * that, instead of wrapping to two rows, a one-line ticker that auto-cycles
 * through the stats (slide in from the right, out to the left).
 */
export function HeroStats() {
  const [index, setIndex] = React.useState(0);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    const id = setTimeout(() => setIndex((i) => (i + 1) % STATS.length), TICK_MS);
    return () => clearTimeout(id);
  }, [index]);

  return (
    <div className="rounded-xl border border-white/10">
      <div className="relative h-11 overflow-hidden lg:hidden">
        <AnimatePresence initial={false}>
          <motion.div
            key={index}
            className="absolute inset-0 flex items-center justify-center gap-2 px-3"
            initial={{ x: reduceMotion ? 0 : 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reduceMotion ? 0 : -48, opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <StatItem stat={STATS[index]} />
          </motion.div>
        </AnimatePresence>
      </div>

      <ul className="hidden lg:grid lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <li
            key={stat.label}
            className={cn(
              "flex items-center justify-center gap-2 border-white/10 px-3 py-3",
              i > 0 && "border-l"
            )}
          >
            <StatItem stat={stat} />
          </li>
        ))}
      </ul>
    </div>
  );
}
