import Link from "next/link";
import { ArrowRightIcon, ZapIcon } from "lucide-react";

import { ProductCard } from "@/components/product/product-card";
import { SaleCountdown } from "@/components/home/sale-countdown";
import { Carousel } from "@/components/shared/carousel";
import type { HomeData } from "@/types/catalog";

export function FlashSaleSection({
  sale,
}: {
  sale: NonNullable<HomeData["flashSale"]>;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div
        className="overflow-hidden rounded-3xl text-background"
        style={{
          background:
            "linear-gradient(120deg, var(--foreground), color-mix(in oklch, var(--foreground) 72%, var(--brand)))",
        }}
      >
        <div className="flex flex-col gap-5 px-6 pt-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-[0.18em] text-brand uppercase">
              <ZapIcon className="size-3.5 fill-current" />
              Limited stock, limited time
            </p>
            <h2 className="font-heading text-2xl font-medium tracking-tight sm:text-3xl">
              {sale.title}
            </h2>
          </div>
          <div className="flex items-center gap-5">
            <SaleCountdown endsAt={sale.endsAt} />
            <Link
              href="/sale"
              className="group flex items-center gap-1.5 text-sm font-medium text-background/80 transition-colors hover:text-background"
            >
              View all
              <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="px-6 py-8 sm:px-8">
          <Carousel
            variant="dark"
            itemClassName="w-56 rounded-2xl bg-background p-3 text-foreground sm:w-60"
          >
            {sale.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
