import { StarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  className?: string;
}

export function RatingStars({ rating, reviewCount, className }: RatingStarsProps) {
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      aria-label={`Rated ${rating} out of 5`}
    >
      <div className="flex items-center gap-px">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon
            key={i}
            className={cn(
              "size-3.5",
              i < Math.round(rating)
                ? "fill-brand text-brand"
                : "fill-muted text-muted"
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {rating.toFixed(1)}
        {reviewCount !== undefined && ` (${reviewCount})`}
      </span>
    </div>
  );
}
