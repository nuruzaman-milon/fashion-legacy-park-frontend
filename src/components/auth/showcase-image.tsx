"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";

/**
 * Editorial photo for the auth panel — shown on the register page only; the
 * sign-in card stays text-only. flex-1 lets it absorb whatever height the
 * form side adds (see the auth layout).
 */
export function AuthShowcaseImage() {
  const pathname = usePathname();
  if (pathname !== "/register") return null;

  return (
    <div className="relative min-h-40 flex-1 overflow-hidden rounded-2xl ring-1 ring-white/10">
      <Image
        src="/images/banner-image/shopping-bag.jpeg"
        alt="Fashion Legacy shopping bags"
        fill
        sizes="(min-width: 1024px) 420px, 0px"
        className="object-cover object-top"
      />
      {/* warm light falling in from the top-left */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(115deg,oklch(0.97_0.05_85/0.45),oklch(0.97_0.05_85/0.14)_30%,transparent_55%)]"
      />
      {/* grounding shadow along the bottom edge */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_top,oklch(0.15_0.018_35/0.45),transparent_40%)]"
      />
    </div>
  );
}
