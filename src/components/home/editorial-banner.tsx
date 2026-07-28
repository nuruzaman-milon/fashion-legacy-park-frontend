import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CrownMark } from "@/components/shared/crown-mark";

const GOLD = "oklch(0.78 0.1 75)";

/** Faint repeating crown pattern, like the tissue lining of the brand bag. */
const CROWN_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='80' viewBox='0 0 96 80'%3E%3Cg transform='translate(32,27)' fill='%23c9a15a' fill-opacity='0.03'%3E%3Ccircle cx='6' cy='7.6' r='2'/%3E%3Ccircle cx='16' cy='3.4' r='2.2'/%3E%3Ccircle cx='26' cy='7.6' r='2'/%3E%3Cpath d='M4.2 20.2 6 10.6l5.6 4.4L16 6.6l4.4 8.4 5.6-4.4 1.8 9.6Z'/%3E%3Crect x='4.6' y='21.6' width='22.8' height='3' rx='1.3'/%3E%3C/g%3E%3C/svg%3E\")";

function BrandLockup() {
  return (
    <div className="flex flex-col items-center text-center">
      <CrownMark className="h-8 w-auto" />
      <p
        className="font-heading mt-3 text-sm font-medium tracking-[0.5em] uppercase"
        style={{ color: GOLD }}
      >
        Fashion
      </p>
      <p
        className="font-heading text-3xl font-medium tracking-[0.18em] uppercase lg:text-4xl"
        style={{ color: GOLD }}
      >
        Legacy
      </p>
      <div
        aria-hidden
        className="mt-4 flex items-center gap-2"
        style={{ color: GOLD }}
      >
        <span className="block h-px w-10 bg-current opacity-60" />
        <span className="block size-1.5 rotate-45 bg-current opacity-80" />
        <span className="block h-px w-10 bg-current opacity-60" />
      </div>
      <p className="mt-4 text-[10px] font-semibold tracking-[0.3em] text-[oklch(0.82_0.05_78)] uppercase">
        Timeless style · Premium quality
      </p>
    </div>
  );
}

/**
 * Editorial banner as one dark brand panel: warm brown gradient with soft
 * gold glows, a faint crown pattern, and a hairline gold frame — copy on
 * the left, the Fashion Legacy lockup on the right behind a gold divider.
 */
export function EditorialBanner() {
  return (
    <section aria-label="Winter editorial" className="mx-auto max-w-8xl px-4 sm:px-6">
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background:
            "radial-gradient(42rem 22rem at 85% 0%, oklch(0.42 0.07 60 / 0.5), transparent 65%), radial-gradient(36rem 20rem at 8% 100%, oklch(0.36 0.06 55 / 0.45), transparent 62%), linear-gradient(115deg, oklch(0.24 0.028 48), oklch(0.16 0.02 38))",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ backgroundImage: CROWN_PATTERN }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-3 rounded-xl border border-[oklch(0.75_0.09_70/0.4)] sm:inset-4"
        />

        <div className="relative z-10 flex flex-col items-center gap-10 px-8 py-12 text-center sm:flex-row sm:items-center sm:justify-between sm:px-14 sm:py-14 sm:text-left lg:px-20">
          <div className="max-w-xl">
            <p
              className="text-xs font-semibold tracking-[0.22em] uppercase"
              style={{ color: GOLD }}
            >
              Winter editorial
            </p>
            <h2
              className="font-heading mt-3 text-3xl font-medium tracking-tight text-balance sm:text-4xl lg:text-5xl"
              style={{ color: "oklch(0.96 0.01 84)" }}
            >
              Timeless style.
              <br />
              <span style={{ color: GOLD }}>Made for you.</span>
            </h2>
            <Button
              size="lg"
              className="mt-7 h-11 bg-[linear-gradient(160deg,oklch(0.85_0.07_84),oklch(0.74_0.1_70)_55%,oklch(0.65_0.1_62))] px-6 text-base font-semibold text-[oklch(0.24_0.03_50)] shadow-[0_5px_14px_-8px_oklch(0.6_0.09_65/0.3)] transition-[filter] hover:brightness-105"
              render={<Link href="/pages/about" />}
            >
              Discover the story
              <ArrowRightIcon />
            </Button>
          </div>

          <div className="shrink-0 sm:border-l sm:border-[oklch(0.75_0.09_70/0.3)] sm:pl-12 lg:pl-16">
            <BrandLockup />
          </div>
        </div>
      </div>
    </section>
  );
}
