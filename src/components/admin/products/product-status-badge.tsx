import { Badge } from "@/components/ui/badge";
import type { ProductStatus } from "@/types/admin";
import { cn } from "@/lib/utils";

const STATUS: Record<ProductStatus, { label: string; className?: string }> = {
  DRAFT: { label: "Draft", className: "text-muted-foreground" },
  PENDING_APPROVAL: {
    label: "Pending approval",
    className:
      "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  ACTIVE: {
    label: "Active",
    className:
      "border-emerald-600/25 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  },
  INACTIVE: { label: "Inactive", className: "text-muted-foreground" },
  REJECTED: {
    label: "Rejected",
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
  OUT_OF_STOCK: {
    label: "Out of stock",
    className:
      "border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const { label, className } = STATUS[status];
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", className)}>
      {label}
    </Badge>
  );
}
