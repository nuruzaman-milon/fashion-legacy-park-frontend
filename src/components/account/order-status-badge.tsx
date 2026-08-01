import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/api/orders";

const LOOKS: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Order placed",
    className:
      "border-amber-600/25 bg-amber-600/10 text-amber-700 dark:text-amber-400",
  },
  CONFIRMED: {
    label: "Confirmed",
    className:
      "border-sky-600/25 bg-sky-600/10 text-sky-700 dark:text-sky-400",
  },
  PROCESSING: {
    label: "Processing",
    className:
      "border-sky-600/25 bg-sky-600/10 text-sky-700 dark:text-sky-400",
  },
  SHIPPED: {
    label: "Shipped",
    className:
      "border-violet-600/25 bg-violet-600/10 text-violet-700 dark:text-violet-400",
  },
  DELIVERED: {
    label: "Delivered",
    className:
      "border-emerald-600/25 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
  RETURNED: { label: "Returned", className: "text-muted-foreground" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const look = LOOKS[status];
  return (
    <Badge variant="outline" className={look.className}>
      {look.label}
    </Badge>
  );
}
