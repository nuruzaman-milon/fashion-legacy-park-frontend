import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Frame for auth status moments (check your email, verify, reset done…).
 * Unlike the forms, these have little content — the card border, layered
 * icon and vertical centering give them enough visual weight to hold their
 * own next to the dark showcase panel.
 */
export function AuthStatusCard({
  icon: Icon,
  iconClassName,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  /** Override the icon disc colors, e.g. for success green. */
  iconClassName?: string;
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col justify-center">
      <div className="rounded-3xl border border-[oklch(0.88_0.04_82/0.8)] bg-card p-8 text-center shadow-xl shadow-[oklch(0.3_0.03_55/0.08)] sm:p-10">
        <span
          className={cn(
            "mx-auto flex size-16 items-center justify-center rounded-full bg-[oklch(0.88_0.06_80/0.45)] text-brand ring-8 ring-[oklch(0.88_0.06_80/0.18)]",
            iconClassName,
          )}
        >
          <Icon className="size-7" strokeWidth={1.75} />
        </span>
        <h1 className="mt-6 font-heading text-2xl font-medium tracking-tight text-balance sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

/** The address a link went to, as a pill the eye lands on. */
export function AuthEmailChip({ email }: { email: string }) {
  return (
    <p className="mx-auto mt-4 w-fit max-w-full truncate rounded-full border border-[oklch(0.88_0.04_82)] bg-muted/60 px-4 py-1.5 text-sm font-semibold">
      {email}
    </p>
  );
}

/** Thin labelled divider separating the primary content from fallbacks. */
export function AuthCardDivider({ label }: { label: string }) {
  return (
    <div className="mt-8 flex items-center gap-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
