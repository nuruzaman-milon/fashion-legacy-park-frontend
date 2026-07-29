import { Skeleton } from "@/components/ui/skeleton";

/** Streams instantly while the product detail loads from the API. */
export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-8xl space-y-10 px-4 py-6 sm:px-6 sm:py-8">
      {/* Breadcrumb */}
      <Skeleton className="h-3 w-64" />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Gallery */}
        <Skeleton className="aspect-3/4 w-full rounded-2xl" />

        {/* Info column */}
        <div>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-8 w-3/4" />
          <Skeleton className="mt-3 h-4 w-44" />
          <Skeleton className="mt-6 h-9 w-36" />

          <div className="mt-8">
            <Skeleton className="h-4 w-16" />
            <div className="mt-3 flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-11 rounded-lg" />
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-4 w-16" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Skeleton className="h-11 w-40 rounded-md" />
            <Skeleton className="h-11 w-36 rounded-md" />
            <Skeleton className="size-11 rounded-md" />
          </div>

          <div className="mt-8 space-y-2.5">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
