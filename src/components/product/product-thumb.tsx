import Image from "next/image";

import { cn } from "@/lib/utils";

/** Stable hue from a slug so each product keeps its own placeholder colour. */
function hueFromSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  }
  return hash;
}

interface ProductThumbProps {
  title: string;
  image: string | null;
  seed: string;
  className?: string;
  sizes?: string;
}

/**
 * Product imagery with a designed fallback: until real photos exist, renders
 * a soft two-tone gradient (stable per product) with a serif monogram.
 */
export function ProductThumb({
  title,
  image,
  seed,
  className,
  sizes,
}: ProductThumbProps) {
  if (image) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <Image
          src={image}
          alt={title}
          fill
          sizes={sizes ?? "(min-width: 768px) 25vw, 50vw"}
          className="object-cover"
          unoptimized={image.endsWith(".svg")}
        />
      </div>
    );
  }

  const hue = hueFromSeed(seed);
  const monogram = title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div
      aria-hidden
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        className
      )}
      style={{
        background: `linear-gradient(155deg, oklch(0.93 0.035 ${hue}), oklch(0.82 0.055 ${(hue + 40) % 360}))`,
      }}
    >
      <span
        className="font-heading text-4xl font-medium select-none"
        style={{ color: `oklch(0.55 0.07 ${hue} / 0.45)` }}
      >
        {monogram}
      </span>
    </div>
  );
}
