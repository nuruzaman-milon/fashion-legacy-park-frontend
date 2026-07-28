import Link from "next/link";

import { ProductThumb } from "@/components/product/product-thumb";
import { Carousel } from "@/components/shared/carousel";
import { SectionHeader } from "@/components/shared/section-header";
import type { CategorySummary } from "@/types/catalog";

export function CategoryCarousel({
  categories,
}: {
  categories: CategorySummary[];
}) {
  return (
    <section className="mx-auto max-w-8xl px-4 sm:px-6">
      <SectionHeader
        eyebrow="Browse the store"
        title="Shop by category"
        className="mb-6 sm:mb-8"
      />
      <Carousel itemClassName="group relative w-40 sm:w-48 lg:w-52">
        {categories.map((category) => (
          <div key={category.id}>
            <ProductThumb
              title={category.name}
              image={category.image}
              seed={category.slug}
              sizes="(min-width: 1024px) 208px, (min-width: 640px) 192px, 160px"
              className="aspect-4/5 rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="mt-2.5">
              <h3 className="text-sm font-semibold">
                <Link
                  href={`/products?category=${category.slug}`}
                  className="after:absolute after:inset-0"
                >
                  {category.name}
                </Link>
              </h3>
              <p className="text-xs text-muted-foreground">
                {category.productCount} items
              </p>
            </div>
          </div>
        ))}
      </Carousel>
    </section>
  );
}
