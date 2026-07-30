/**
 * The dashboard's remaining design-time data. Categories and products are on
 * the real admin API now; these figures stay mock until the orders module
 * ships in the backend (Order/Review models exist, routes don't).
 */

export const adminStats = {
  /** Prisma Decimal → string, like the real API will send. */
  revenue30d: "1284500",
  revenueDeltaPct: 12.4,
  orders30d: 486,
  ordersDeltaPct: 8.1,
  activeProducts: 74,
  draftProducts: 9,
  customers: 1382,
  customersDeltaPct: 4.6,
};

/** Order model exists in the schema but has no API yet — design-only shape. */
export interface MockRecentOrder {
  id: string;
  orderNo: string;
  customer: string;
  itemCount: number;
  total: string;
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
}

export const mockRecentOrders: MockRecentOrder[] = [
  {
    id: "o1",
    orderNo: "FL-20260730-0142",
    customer: "Nusrat Jahan",
    itemCount: 3,
    total: "7840",
    status: "PENDING",
    createdAt: "2026-07-30T09:24:00.000Z",
  },
  {
    id: "o2",
    orderNo: "FL-20260730-0141",
    customer: "Tanvir Ahmed",
    itemCount: 1,
    total: "2450",
    status: "CONFIRMED",
    createdAt: "2026-07-30T08:02:00.000Z",
  },
  {
    id: "o3",
    orderNo: "FL-20260729-0139",
    customer: "Sadia Islam",
    itemCount: 2,
    total: "5900",
    status: "SHIPPED",
    createdAt: "2026-07-29T18:40:00.000Z",
  },
  {
    id: "o4",
    orderNo: "FL-20260729-0135",
    customer: "Rakibul Hasan",
    itemCount: 4,
    total: "11260",
    status: "DELIVERED",
    createdAt: "2026-07-29T11:15:00.000Z",
  },
  {
    id: "o5",
    orderNo: "FL-20260728-0131",
    customer: "Farhana Akter",
    itemCount: 1,
    total: "1650",
    status: "DELIVERED",
    createdAt: "2026-07-28T15:52:00.000Z",
  },
  {
    id: "o6",
    orderNo: "FL-20260728-0127",
    customer: "Mehedi Hasan",
    itemCount: 2,
    total: "4300",
    status: "CANCELLED",
    createdAt: "2026-07-28T10:08:00.000Z",
  },
];

export interface MockLowStockVariant {
  id: string;
  product: string;
  productSlug: string;
  variant: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  image: string | null;
}

export const mockLowStock: MockLowStockVariant[] = [
  {
    id: "v1",
    product: "Scarlet Taffeta Party Gown",
    productSlug: "scarlet-party-gown",
    variant: "Red / M",
    sku: "GOWN-RED-M",
    stock: 0,
    lowStockThreshold: 5,
    image: "/images/products/scarlet-party-gown.jpg",
  },
  {
    id: "v2",
    product: "Sky Blue Dotted Wrap Maxi",
    productSlug: "sky-wrap-maxi-dress",
    variant: "Blue / S",
    sku: "MAXI-BLU-S",
    stock: 2,
    lowStockThreshold: 5,
    image: "/images/products/sky-wrap-maxi-dress.jpg",
  },
  {
    id: "v3",
    product: "Chambray Printed Casual Shirt",
    productSlug: "chambray-casual-shirt",
    variant: "Indigo / XL",
    sku: "SHIRT-IND-XL",
    stock: 3,
    lowStockThreshold: 5,
    image: "/images/products/chambray-casual-shirt.jpg",
  },
  {
    id: "v4",
    product: "Ivory Floral Wrap Dress",
    productSlug: "ivory-floral-wrap-dress",
    variant: "Ivory / L",
    sku: "DRESS-IVO-L",
    stock: 4,
    lowStockThreshold: 5,
    image: "/images/products/ivory-floral-wrap-dress.jpg",
  },
];
