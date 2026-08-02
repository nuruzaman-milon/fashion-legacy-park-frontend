import { Badge } from "@/components/ui/badge";
import type { SellerStatus } from "@/lib/api/seller/profile";

const LOOKS: Record<SellerStatus, { label: string; className: string }> = {
  APPROVED: {
    label: "Approved",
    className:
      "border-emerald-600/25 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  },
  PENDING: {
    label: "Pending approval",
    className: "border-sky-600/25 bg-sky-600/10 text-sky-700 dark:text-sky-400",
  },
  SUSPENDED: {
    label: "Suspended",
    className:
      "border-amber-600/25 bg-amber-600/10 text-amber-700 dark:text-amber-400",
  },
  REJECTED: { label: "Rejected", className: "text-muted-foreground" },
};

export function SellerStatusBadge({ status }: { status: SellerStatus }) {
  const look = LOOKS[status];
  return (
    <Badge variant="outline" className={look.className}>
      {look.label}
    </Badge>
  );
}
