import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  viewAllHref?: string;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  viewAllHref,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && (
          <p className="mb-1.5 text-xs font-semibold tracking-[0.18em] text-brand uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="font-heading text-2xl font-medium tracking-tight text-balance sm:text-3xl">
          {title}
        </h2>
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="group flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground/70 transition-colors hover:text-brand"
        >
          View all
          <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
