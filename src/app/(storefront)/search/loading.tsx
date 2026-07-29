import { ProductCardSkeleton } from "@/components/product/product-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** Streams instantly while search results load from the API. */
export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 sm:py-10">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-2 h-9 w-64" />
      <Skeleton className="mt-6 h-11 w-full max-w-2xl rounded-full" />
      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
