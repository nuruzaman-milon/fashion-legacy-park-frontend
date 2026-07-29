import { ProductCardSkeleton } from "@/components/product/product-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** Streams instantly while the listing's products and filters load. */
export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex gap-10">
        <aside className="hidden w-60 shrink-0 lg:block lg:pt-8">
          {Array.from({ length: 3 }).map((_, group) => (
            <div key={group} className="mb-8">
              <Skeleton className="h-4 w-24" />
              <div className="mt-3.5 space-y-2.5">
                {Array.from({ length: 4 }).map((_, row) => (
                  <Skeleton key={row} className="h-6 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </aside>

        <div className="min-w-0 flex-1 lg:pt-8">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="mt-2 h-9 w-48" />
          <div className="mt-6 flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-40 rounded-lg" />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
