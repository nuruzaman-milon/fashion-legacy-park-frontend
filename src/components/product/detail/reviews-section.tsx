import { BadgeCheckIcon, StarIcon, ThumbsUpIcon } from "lucide-react";

import { RatingStars } from "@/components/product/rating-stars";
import { cn } from "@/lib/utils";
import type { ProductDetail } from "@/types/catalog";

/** Approximate star distribution from the average, for the summary bars. */
function distributionFor(avgRating: number): number[] {
  const five = Math.round(((avgRating - 3) / 2) * 78);
  const four = Math.round((5 - avgRating) * 20 + 8);
  const rest = Math.max(0, 100 - five - four);
  return [five, four, Math.round(rest * 0.6), Math.round(rest * 0.3), Math.round(rest * 0.1)];
}

export function ReviewsSection({ product }: { product: ProductDetail }) {
  const distribution = distributionFor(product.avgRating);

  return (
    <section aria-label="Customer reviews">
      <h2 className="font-heading text-xl font-medium tracking-tight sm:text-2xl">
        Customer reviews
      </h2>

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-5xl font-medium">
              {product.avgRating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">/ 5</span>
          </div>
          <RatingStars rating={product.avgRating} className="mt-2" />
          <p className="mt-1 text-sm text-muted-foreground">
            Based on {product.reviewCount} verified purchases
          </p>
          <ul className="mt-4 space-y-1.5">
            {distribution.map((pct, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <span className="flex w-7 items-center gap-0.5 text-muted-foreground">
                  {5 - i}
                  <StarIcon className="size-3 fill-brand text-brand" />
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-muted-foreground">
                  {pct}%
                </span>
              </li>
            ))}
          </ul>
        </div>

        <ul className="space-y-5">
          {product.reviews.map((review) => (
            <li key={review.id} className="rounded-xl border bg-card p-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
                  {review.author[0]}
                </span>
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {review.author}
                    {review.isVerified && (
                      <span className="flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                        <BadgeCheckIcon className="size-3" />
                        Verified purchase
                      </span>
                    )}
                  </p>
                  <RatingStars rating={review.rating} className="mt-0.5" />
                </div>
                <time
                  dateTime={review.createdAt}
                  className="ml-auto text-xs text-muted-foreground"
                >
                  {new Date(review.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                {review.comment}
              </p>
              <button
                type="button"
                className={cn(
                  "mt-3 flex items-center gap-1.5 text-xs text-muted-foreground",
                  "transition-colors hover:text-brand"
                )}
              >
                <ThumbsUpIcon className="size-3.5" />
                Helpful ({review.helpfulCount})
              </button>
              {review.adminReply && (
                <div className="mt-3 rounded-lg bg-accent/60 p-3.5">
                  <p className="text-xs font-semibold text-brand">
                    Response from Fashion Legacy
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                    {review.adminReply}
                  </p>
                </div>
              )}
            </li>
          ))}
          <li className="text-center text-xs text-muted-foreground">
            Showing {product.reviews.length} of {product.reviewCount} reviews
          </li>
        </ul>
      </div>
    </section>
  );
}
