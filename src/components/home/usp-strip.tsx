"use client";

import * as React from "react";
import {
  BadgeCheckIcon,
  HandCoinsIcon,
  RefreshCcwIcon,
  TruckIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const TICK_MS = 3000;

const USPS = [
  {
    icon: TruckIcon,
    title: "Nationwide delivery",
    detail: "Pathao, Steadfast & RedX to all 64 districts",
  },
  {
    icon: HandCoinsIcon,
    title: "Cash on Delivery",
    detail: "Pay at your door — or bKash & cards online",
  },
  {
    icon: RefreshCcwIcon,
    title: "7-day easy returns",
    detail: "Wrong size or damaged? We'll make it right",
  },
  {
    icon: BadgeCheckIcon,
    title: "Verified reviews",
    detail: "Every rating comes from a real purchase",
  },
];

function UspItem({ usp }: { usp: (typeof USPS)[number] }) {
  return (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
        <usp.icon className="size-5" />
      </span>
      <div>
        <p className="text-sm font-semibold">{usp.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {usp.detail}
        </p>
      </div>
    </>
  );
}

/**
 * Trust strip: a 4-up grid from `sm` up; on mobile a one-at-a-time ticker
 * where each USP slides in, holds, and slides out to the left.
 */
export function UspStrip() {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const id = setTimeout(
      () => setIndex((i) => (i + 1) % USPS.length),
      TICK_MS
    );
    return () => clearTimeout(id);
  }, [index]);

  const prev = (index - 1 + USPS.length) % USPS.length;

  return (
    <section aria-label="Why shop with us" className="border-y bg-card">
      <div className="relative h-18 overflow-hidden sm:hidden">
        {USPS.map((usp, i) => (
          <div
            key={usp.title}
            aria-hidden={i !== index}
            className={cn(
              "absolute inset-x-4 top-1/2 flex -translate-y-1/2 items-center gap-3.5 transition-all duration-500 ease-out motion-reduce:transition-none",
              i === index
                ? "translate-x-0 opacity-100"
                : i === prev
                  ? "-translate-x-8 opacity-0"
                  : "translate-x-8 opacity-0"
            )}
          >
            <UspItem usp={usp} />
          </div>
        ))}
      </div>

      <ul className="mx-auto hidden max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-6 sm:grid sm:px-6 lg:grid-cols-4">
        {USPS.map((usp) => (
          <li key={usp.title} className="flex items-start gap-3.5">
            <UspItem usp={usp} />
          </li>
        ))}
      </ul>
    </section>
  );
}
