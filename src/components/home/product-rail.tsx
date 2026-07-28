import { ProductCard } from "@/components/product/product-card";
import { Carousel } from "@/components/shared/carousel";
import { SectionHeader } from "@/components/shared/section-header";
import type { ProductListItem } from "@/types/catalog";

interface ProductRailProps {
  eyebrow?: string;
  title: string;
  viewAllHref?: string;
  products: ProductListItem[];
  /** "grid" wraps into rows; "scroll" is a horizontal snap rail. */
  layout?: "grid" | "scroll";
}

export function ProductRail({
  eyebrow,
  title,
  viewAllHref,
  products,
  layout = "grid",
}: ProductRailProps) {
  return (
    <section className="mx-auto max-w-8xl px-4 sm:px-6">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        viewAllHref={viewAllHref}
        className="mb-6 sm:mb-8"
      />
      {layout === "grid" ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      ) : (
        <Carousel itemClassName="w-56 sm:w-64" trackClassName="gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Carousel>
      )}
    </section>
  );
}
