import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  HeroShowcase,
  type ShowcaseSlide,
} from "@/components/home/hero-showcase";
import type { HomeBanner } from "@/types/catalog";

export function Hero({ banner }: { banner: HomeBanner }) {
  const slides: ShowcaseSlide[] = banner.image
    ? [
        { src: banner.image, alt: banner.imageAlt ?? banner.title },
        ...(banner.supportingImages ?? []),
      ]
    : [];

  return (
    <section
      className="relative overflow-hidden text-background"
      style={{
        background:
          "radial-gradient(70rem 35rem at 82% -8%, oklch(0.45 0.09 60 / 0.35), transparent 62%), linear-gradient(115deg, oklch(0.21 0.022 45), oklch(0.155 0.018 35))",
      }}
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.05fr_1fr] md:py-20 lg:gap-16">
        <div>
          {banner.eyebrow && (
            <p className="mb-4 inline-block rounded-full border border-[oklch(0.75_0.09_70_/_0.35)] bg-white/5 px-3.5 py-1 text-xs font-semibold tracking-[0.16em] text-[oklch(0.82_0.09_75)] uppercase">
              {banner.eyebrow}
            </p>
          )}
          <h1 className="font-heading text-4xl leading-[1.08] font-medium tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {banner.title}
          </h1>
          {banner.subtitle && (
            <p className="mt-5 max-w-md text-base leading-relaxed text-background/70 sm:text-lg">
              {banner.subtitle}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="h-11 bg-background px-6 text-base text-foreground hover:bg-background/85"
              render={<Link href={banner.href} />}
            >
              {banner.ctaLabel}
              <ArrowRightIcon />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 border-white/25 bg-transparent px-6 text-base text-background hover:bg-white/10 hover:text-background dark:border-white/25 dark:bg-transparent dark:hover:bg-white/10"
              render={<Link href="/sale" />}
            >
              Explore the sale
            </Button>
          </div>
          <dl className="mt-10 flex gap-8 border-t border-white/15 pt-6">
            {[
              ["500+", "styles in stock"],
              ["64", "districts served"],
              ["4.7★", "average rating"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-heading text-2xl font-medium">{value}</dd>
                <dd className="text-xs text-background/60">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {slides.length > 0 && (
          <HeroShowcase
            slides={slides}
            className="mx-auto w-full max-w-md lg:max-w-lg"
          />
        )}
      </div>
    </section>
  );
}
