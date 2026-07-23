import { BrandBand } from "@/components/home/brand-band";
import { CategoryCarousel } from "@/components/home/category-carousel";
import { EditorialBanner } from "@/components/home/editorial-banner";
import { FlashSaleSection } from "@/components/home/flash-sale-section";
import { Hero } from "@/components/home/hero";
import { ProductRail } from "@/components/home/product-rail";
import { UspStrip } from "@/components/home/usp-strip";
import { getHomeData } from "@/lib/api/home";

export default async function HomePage() {
  const home = await getHomeData();

  return (
    <>
      <div className="space-y-8 pb-8 sm:space-y-12 sm:pb-12">
        <Hero banner={home.banner} />
        <CategoryCarousel categories={home.categories} />
        {home.flashSale && <FlashSaleSection sale={home.flashSale} />}
        <EditorialBanner />
        <ProductRail
          eyebrow="Just landed"
          title="New arrivals"
          viewAllHref="/products?sort=newest"
          products={home.newArrivals}
          layout="scroll"
        />
        <BrandBand />
        <ProductRail
          eyebrow="Most loved"
          title="Best sellers"
          viewAllHref="/products?sort=best-selling"
          products={home.bestSellers}
          layout="scroll"
        />
      </div>
      <UspStrip />
    </>
  );
}
