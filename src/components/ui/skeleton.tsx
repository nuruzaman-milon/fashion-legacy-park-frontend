import { cn } from "@/lib/utils";

/** Pulsing placeholder block — size/shape it with className. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted", className)}
    />
  );
}
