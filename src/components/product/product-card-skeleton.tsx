import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors ProductCard's layout while its data streams in. */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Skeleton className="aspect-3/4 rounded-xl" />
      <div className="mt-3 flex flex-col gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

/** A scrolling rail of card skeletons under a section-header placeholder. */
export function RailSkeleton({ cards = 5 }: { cards?: number }) {
  return (
    <section className="mx-auto max-w-8xl px-4 sm:px-6">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-2 h-8 w-64" />
      <div className="mt-6 flex gap-4 overflow-hidden sm:mt-8">
        {Array.from({ length: cards }).map((_, i) => (
          <ProductCardSkeleton key={i} className="w-56 shrink-0 sm:w-60" />
        ))}
      </div>
    </section>
  );
}
