import Link from "next/link";

import { Button } from "@/components/ui/button";

export function BrandBand() {
  return (
    <section className="border-y bg-accent/50">
      <div className="mx-auto max-w-3xl px-4 py-8 text-center sm:px-6 sm:py-12">
        <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-brand uppercase">
          The Fashion Legacy promise
        </p>
        <blockquote className="font-heading text-2xl leading-snug font-medium tracking-tight text-balance sm:text-3xl">
          One storefront, one standard. Every piece is sourced from makers we
          trust and checked by our team before it reaches you.
        </blockquote>
        <Button
          variant="outline"
          className="mt-8"
          render={<Link href="/pages/about" />}
        >
          Our story
        </Button>
      </div>
    </section>
  );
}
