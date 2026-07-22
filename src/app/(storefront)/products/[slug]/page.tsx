import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";

import { ProductView } from "@/components/product/detail/product-view";
import { ReviewsSection } from "@/components/product/detail/reviews-section";
import { ProductRail } from "@/components/home/product-rail";
import { Separator } from "@/components/ui/separator";
import {
  getAllProductSlugs,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/api/products";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.title,
    description: product.description.slice(0, 155),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category.slug, product.id);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <li>
            <Link href="/" className="transition-colors hover:text-brand">
              Home
            </Link>
          </li>
          <ChevronRightIcon className="size-3" aria-hidden />
          <li>
            <Link
              href={`/categories/${product.category.slug}`}
              className="transition-colors hover:text-brand"
            >
              {product.category.name}
            </Link>
          </li>
          <ChevronRightIcon className="size-3" aria-hidden />
          <li aria-current="page" className="font-medium text-foreground">
            {product.title}
          </li>
        </ol>
      </nav>

      <ProductView product={product} />

      <Separator />

      <section
        aria-label="Product information"
        className="grid gap-10 lg:grid-cols-[1.5fr_1fr]"
      >
        <div>
          <h2 className="font-heading text-xl font-medium tracking-tight sm:text-2xl">
            About this product
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/80 sm:text-base">
            {product.description}
          </p>
        </div>
        <div>
          <h2 className="font-heading text-xl font-medium tracking-tight sm:text-2xl">
            Specifications
          </h2>
          <dl className="mt-4 divide-y rounded-xl border bg-card">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex gap-4 px-4 py-3 text-sm">
                <dt className="w-28 shrink-0 text-muted-foreground">{key}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Separator />

      <ReviewsSection product={product} />

      {related.length > 0 && (
        <>
          <Separator />
          <ProductRail
            eyebrow="You may also like"
            title={`More from ${product.category.name}`}
            viewAllHref={`/categories/${product.category.slug}`}
            products={related}
            layout="scroll"
          />
        </>
      )}
    </div>
  );
}
