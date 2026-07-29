import { RailSkeleton } from "@/components/product/product-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

/** Streams instantly while the homepage's API-backed sections render. */
export default function HomeLoading() {
  return (
    <div className="space-y-8 pb-8 sm:space-y-12 sm:pb-12">
      {/* Hero */}
      <Skeleton className="h-[26rem] w-full rounded-none sm:h-[30rem]" />

      {/* Category strip */}
      <section className="mx-auto max-w-8xl px-4 sm:px-6">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-2 h-8 w-56" />
        <div className="mt-6 flex gap-4 overflow-hidden sm:mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-40 shrink-0 sm:w-48 lg:w-52">
              <Skeleton className="aspect-4/5 rounded-xl" />
              <Skeleton className="mt-2.5 h-4 w-24" />
              <Skeleton className="mt-1.5 h-3 w-16" />
            </div>
          ))}
        </div>
      </section>

      {/* Flash sale / product rails */}
      <RailSkeleton />
      <RailSkeleton />
    </div>
  );
}
