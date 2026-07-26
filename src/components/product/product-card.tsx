import Link from "next/link";
import { HeartIcon, ShoppingBagIcon, ZapIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/product/rating-stars";
import { ProductThumb } from "@/components/product/product-thumb";
import { discountPercent, formatPrice, formatPriceRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductListItem } from "@/types/catalog";

const ACTION_BUTTON =
  "flex size-8 items-center justify-center rounded-full bg-background/85 text-foreground opacity-0 shadow-sm backdrop-blur transition-all duration-200 group-hover:opacity-100 hover:bg-brand hover:text-brand-foreground focus-visible:opacity-100 motion-reduce:transition-none";

interface ProductCardProps {
  product: ProductListItem;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const sale = product.flashSale;
  const price = sale ? sale.flashPrice : product.minPrice;
  const compareAt = sale ? product.minPrice : product.comparePrice;
  const hasDiscount = compareAt !== null && compareAt > price;

  return (
    <article className={cn("group relative isolate", className)}>
      <div className="relative">
        <ProductThumb
          title={product.title}
          image={product.image}
          seed={product.slug}
          className="aspect-3/4 rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {hasDiscount && (
            <Badge className="bg-brand text-brand-foreground">
              −{discountPercent(price, compareAt)}%
            </Badge>
          )}
          {product.isNew && !hasDiscount && (
            <Badge variant="secondary">New</Badge>
          )}
        </div>
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            title="Add to wishlist"
            aria-label={`Add ${product.title} to wishlist`}
            className={ACTION_BUTTON}
          >
            <HeartIcon className="size-4" />
          </button>
          <button
            type="button"
            title="Add to cart"
            aria-label={`Add ${product.title} to cart`}
            className={cn(ACTION_BUTTON, "delay-75")}
          >
            <ShoppingBagIcon className="size-4" />
          </button>
          <button
            type="button"
            title="Buy now"
            aria-label={`Buy ${product.title} now`}
            className={cn(ACTION_BUTTON, "delay-150")}
          >
            <ZapIcon className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {product.category.name}
        </p>
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">
          <Link
            href={`/products/${product.slug}`}
            className="after:absolute after:inset-0"
          >
            {product.title}
          </Link>
        </h3>
        <RatingStars rating={product.avgRating} reviewCount={product.reviewCount} />
        <p className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-foreground">
            {sale || product.minPrice === product.maxPrice
              ? formatPrice(price)
              : formatPriceRange(product.minPrice, product.maxPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(compareAt)}
            </span>
          )}
        </p>
        {sale?.quantityLimit && (
          <div className="mt-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand"
                style={{
                  width: `${Math.min(100, (sale.soldCount / sale.quantityLimit) * 100)}%`,
                }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {sale.soldCount} of {sale.quantityLimit} sold
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
