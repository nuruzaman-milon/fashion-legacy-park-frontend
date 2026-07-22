import { BrandBand } from "@/components/home/brand-band";
import { CategoryCarousel } from "@/components/home/category-carousel";
import { FlashSaleSection } from "@/components/home/flash-sale-section";
import { Hero } from "@/components/home/hero";
import { ProductRail } from "@/components/home/product-rail";
import { UspStrip } from "@/components/home/usp-strip";
import { getHomeData } from "@/lib/api/home";

export default async function HomePage() {
  const home = await getHomeData();

  return (
    <>
      <Hero banner={home.banner} />
      <UspStrip />
      <CategoryCarousel categories={home.categories} />
      {home.flashSale && <FlashSaleSection sale={home.flashSale} />}
      <ProductRail
        eyebrow="Just landed"
        title="New arrivals"
        viewAllHref="/products?sort=newest"
        products={home.newArrivals}
      />
      <BrandBand />
      <ProductRail
        eyebrow="Most loved"
        title="Best sellers"
        viewAllHref="/products?sort=best-selling"
        products={home.bestSellers}
        layout="scroll"
      />
    </>
  );
}
