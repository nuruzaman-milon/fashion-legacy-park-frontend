import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  HandCoinsIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  RefreshCcwIcon,
  TruckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { HeroStats } from "@/components/home/hero-stats";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "How Fashion Legacy grew from a two-machine tailoring room in Dhanmondi into a storefront trusted across all 64 districts of Bangladesh.",
};

const VALUES = [
  {
    icon: BadgeCheckIcon,
    title: "Checked by hand",
    text: "Every piece passes through our QC studio in Dhaka before it ships — stitching, fabric, fit. If we wouldn’t wear it, we don’t send it.",
  },
  {
    icon: HandCoinsIcon,
    title: "Honest prices",
    text: "Cash on Delivery, bKash or card — pay how you like, and pay what the piece is worth. No inflated “sale” games.",
  },
  {
    icon: TruckIcon,
    title: "Everywhere you are",
    text: "From Teknaf to Tetulia — all 64 districts, door to door, with free delivery inside Dhaka on orders over ৳2,000.",
  },
  {
    icon: RefreshCcwIcon,
    title: "Easy to change your mind",
    text: "7-day returns, no long forms, no awkward questions. Fashion should feel like a gift, not a gamble.",
  },
];

const MILESTONES = [
  {
    year: "2019",
    title: "Two machines in Dhanmondi",
    text: "Fashion Legacy starts as a family tailoring room — a father’s thirty years of cutting fabric, a daughter’s eye for what Dhaka wants to wear next.",
  },
  {
    year: "2021",
    title: "The first thousand orders",
    text: "Word travels faster than rickshaws. We open our own QC studio and promise something rare: every single piece checked before it ships.",
  },
  {
    year: "2023",
    title: "All 64 districts",
    text: "Cash on Delivery goes nationwide. The same kurti that sells in Gulshan now arrives at a doorstep in Rangpur, checked to the same standard.",
  },
  {
    year: "2026",
    title: "20,000 members and counting",
    text: "A storefront, a wishlist, a promise — one standard for every piece. The legacy keeps growing, one order at a time.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-16 px-4 py-8 sm:px-6 sm:py-12 sm:space-y-20">
      {/* Editorial hero */}
      <section
        className="grid gap-10 rounded-3xl p-8 text-background sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-14 lg:p-14"
        style={{
          background:
            "radial-gradient(40rem 20rem at 85% -10%, oklch(0.45 0.09 60 / 0.35), transparent 62%), linear-gradient(150deg, oklch(0.21 0.022 45), oklch(0.15 0.018 35))",
        }}
      >
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-[oklch(0.82_0.09_75)] uppercase">
            Our story
          </p>
          <h1 className="font-heading mt-3 text-3xl leading-tight font-medium tracking-tight text-balance sm:text-4xl xl:text-5xl">
            Stitched in Dhaka, worn across Bangladesh.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-background/75 sm:text-base">
            Fashion Legacy began with a simple frustration: beautiful clothes
            were easy to find, but clothes you could <em>trust</em> — true to
            size, true to photo, true to price — were not. So we built the
            storefront we wished existed. One standard, every piece.
          </p>
        </div>
        <div className="relative aspect-4/5 overflow-hidden rounded-2xl ring-1 ring-white/10">
          <Image
            src="/images/banner-image/shopping-bag.jpeg"
            alt="Fashion Legacy shopping bags"
            fill
            priority
            sizes="(min-width: 1024px) 420px, 100vw"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(115deg,oklch(0.97_0.05_85/0.4),oklch(0.97_0.05_85/0.12)_30%,transparent_55%)]"
          />
        </div>
      </section>

      {/* Narrative */}
      <section className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
        <div className="relative hidden aspect-3/4 overflow-hidden rounded-2xl lg:block">
          <Image
            src="/images/products/midnight-slim-blazer.jpg"
            alt="Tailored blazer from the Fashion Legacy collection"
            fill
            sizes="(min-width: 1024px) 480px, 0px"
            className="object-cover"
          />
        </div>
        <div className="max-w-2xl">
          <p className="mb-1.5 text-xs font-semibold tracking-[0.18em] text-brand uppercase">
            How it started
          </p>
          <h2 className="font-heading text-2xl font-medium tracking-tight text-balance sm:text-3xl">
            A tailoring family, a promise, and one small room
          </h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/80 sm:text-base">
            <p>
              Before we were a storefront, we were a tailoring room in
              Dhanmondi — two machines, a cutting table, and a father who could
              tell a fabric’s worth by touch alone. Customers didn’t come for
              variety; they came because whatever left that room <em>fit</em>.
            </p>
            <p>
              When we took the family standard online in 2019, we kept the
              rule that built it: nothing ships unseen. Today a dozen hands run
              our QC studio, checking stitching, colour and finish on every
              kurti, panjabi, saree and sneaker that carries our name.
            </p>
            <p>
              The name is a reminder, not a boast. Every order is a chance to
              honour a legacy — and to start one in your wardrobe.
            </p>
          </div>
          <blockquote className="font-heading mt-8 border-l-2 border-brand pl-5 text-xl leading-snug font-medium tracking-tight text-balance sm:text-2xl">
            “One storefront, one standard — every piece checked by our team
            before it reaches you.”
          </blockquote>
        </div>
      </section>

      {/* Stats band */}
      <section
        className="rounded-3xl p-6 sm:p-8"
        style={{
          background:
            "linear-gradient(150deg, oklch(0.21 0.022 45), oklch(0.15 0.018 35))",
        }}
      >
        <HeroStats />
      </section>

      {/* Values */}
      <section>
        <p className="mb-1.5 text-xs font-semibold tracking-[0.18em] text-brand uppercase">
          What we stand for
        </p>
        <h2 className="font-heading text-2xl font-medium tracking-tight sm:text-3xl">
          Four promises, kept daily
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => (
            <div key={value.title} className="rounded-2xl border bg-card p-6">
              <span className="flex size-10 items-center justify-center rounded-full bg-accent/70 text-brand">
                <value.icon className="size-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 font-heading text-lg font-medium">
                {value.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {value.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section>
        <p className="mb-1.5 text-xs font-semibold tracking-[0.18em] text-brand uppercase">
          The journey
        </p>
        <h2 className="font-heading text-2xl font-medium tracking-tight sm:text-3xl">
          From one room to sixty-four districts
        </h2>
        <ol className="mt-8 space-y-10 border-l border-border pl-8 sm:space-y-12">
          {MILESTONES.map((milestone) => (
            <li key={milestone.year} className="relative">
              <span
                aria-hidden
                className="absolute top-1 -left-8 size-3 -translate-x-1/2 rounded-full bg-brand ring-4 ring-background"
              />
              <p className="font-heading text-sm font-semibold text-brand">
                {milestone.year}
              </p>
              <h3 className="mt-1 font-heading text-lg font-medium sm:text-xl">
                {milestone.title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/80">
                {milestone.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section
        className="flex flex-col items-start gap-8 rounded-3xl p-8 text-background sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:p-12"
        style={{
          background:
            "radial-gradient(40rem 20rem at 15% -10%, oklch(0.45 0.09 60 / 0.35), transparent 62%), linear-gradient(150deg, oklch(0.21 0.022 45), oklch(0.15 0.018 35))",
        }}
      >
        <div>
          <h2 className="font-heading text-2xl font-medium tracking-tight text-balance sm:text-3xl">
            Become part of the legacy
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-background/75">
            New pieces land every week — checked, priced honestly and delivered
            to your door anywhere in Bangladesh.
          </p>
          <ul className="mt-5 space-y-1.5 text-xs text-background/65">
            <li className="flex items-center gap-2">
              <MapPinIcon className="size-3.5 text-[oklch(0.82_0.09_75)]" />
              {siteConfig.contact.address}
            </li>
            <li className="flex items-center gap-2">
              <PhoneIcon className="size-3.5 text-[oklch(0.82_0.09_75)]" />
              {siteConfig.contact.phone} · {siteConfig.contact.hours}
            </li>
            <li className="flex items-center gap-2">
              <MailIcon className="size-3.5 text-[oklch(0.82_0.09_75)]" />
              {siteConfig.contact.email}
            </li>
          </ul>
        </div>
        <Button
          size="lg"
          className="h-11 shrink-0 bg-[linear-gradient(160deg,oklch(0.85_0.07_84),oklch(0.74_0.1_70)_55%,oklch(0.65_0.1_62))] px-6 text-base font-semibold text-[oklch(0.24_0.03_50)] transition-[filter] hover:brightness-105"
          render={<Link href="/products" />}
        >
          Browse the collection
          <ArrowRightIcon />
        </Button>
      </section>
    </div>
  );
}
