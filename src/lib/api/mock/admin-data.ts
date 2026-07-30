import type {
  AdminCategory,
  AdminProductDetail,
  AdminProductListItem,
} from "@/types/admin";

/**
 * Design-time data for the admin panel. Categories and products mirror the
 * real `GET /admin/*` response shapes and swap out for `apiFetch` calls once
 * the pages are wired. Dashboard sales figures are pure fiction — the orders
 * API doesn't exist yet — and stay mock until it ships.
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
  status:
    | "PENDING"
    | "CONFIRMED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";
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

const now = "2026-07-30T00:00:00.000Z";

function category(
  partial: Partial<AdminCategory> &
    Pick<AdminCategory, "id" | "name" | "slug" | "sortOrder">,
): AdminCategory {
  return {
    description: null,
    icon: null,
    image: null,
    banner: null,
    parentId: null,
    isActive: true,
    showOnHome: false,
    homeSortOrder: 0,
    metaTitle: null,
    metaDescription: null,
    metaKeywords: null,
    createdAt: now,
    updatedAt: now,
    _count: { children: 0, products: 0 },
    ...partial,
  };
}

/** Flat, like the real list endpoint; pages build the tree from parentId. */
export const mockAdminCategories: AdminCategory[] = [
  category({
    id: "c-women",
    name: "Women's Wear",
    slug: "womens-wear",
    sortOrder: 0,
    showOnHome: true,
    homeSortOrder: 0,
    image: "/images/products/ivory-floral-wrap-dress.jpg",
    _count: { children: 4, products: 34 },
  }),
  category({
    id: "c-women-saree",
    name: "Sarees",
    slug: "sarees",
    parentId: "c-women",
    sortOrder: 0,
    _count: { children: 0, products: 12 },
  }),
  category({
    id: "c-women-salwar",
    name: "Salwar Kameez",
    slug: "salwar-kameez",
    parentId: "c-women",
    sortOrder: 1,
    _count: { children: 0, products: 9 },
  }),
  category({
    id: "c-women-kurti",
    name: "Kurtis",
    slug: "kurtis",
    parentId: "c-women",
    sortOrder: 2,
    _count: { children: 0, products: 8 },
  }),
  category({
    id: "c-women-western",
    name: "Western Tops",
    slug: "western-tops",
    parentId: "c-women",
    sortOrder: 3,
    isActive: false,
    _count: { children: 0, products: 5 },
  }),
  category({
    id: "c-men",
    name: "Men's Wear",
    slug: "mens-wear",
    sortOrder: 1,
    showOnHome: true,
    homeSortOrder: 1,
    image: "/images/products/chambray-casual-shirt.jpg",
    _count: { children: 3, products: 26 },
  }),
  category({
    id: "c-men-panjabi",
    name: "Panjabi",
    slug: "panjabi",
    parentId: "c-men",
    sortOrder: 0,
    _count: { children: 0, products: 11 },
  }),
  category({
    id: "c-men-shirts",
    name: "Shirts",
    slug: "shirts",
    parentId: "c-men",
    sortOrder: 1,
    _count: { children: 0, products: 9 },
  }),
  category({
    id: "c-men-tshirts",
    name: "T-Shirts",
    slug: "t-shirts",
    parentId: "c-men",
    sortOrder: 2,
    _count: { children: 0, products: 6 },
  }),
  category({
    id: "c-kids",
    name: "Kids",
    slug: "kids",
    sortOrder: 2,
    showOnHome: true,
    homeSortOrder: 2,
    _count: { children: 2, products: 10 },
  }),
  category({
    id: "c-kids-boys",
    name: "Boys",
    slug: "boys",
    parentId: "c-kids",
    sortOrder: 0,
    _count: { children: 0, products: 6 },
  }),
  category({
    id: "c-kids-girls",
    name: "Girls",
    slug: "girls",
    parentId: "c-kids",
    sortOrder: 1,
    _count: { children: 0, products: 4 },
  }),
  category({
    id: "c-accessories",
    name: "Accessories",
    slug: "accessories",
    sortOrder: 3,
    showOnHome: true,
    homeSortOrder: 3,
    _count: { children: 2, products: 13 },
  }),
  category({
    id: "c-acc-bags",
    name: "Bags",
    slug: "bags",
    parentId: "c-accessories",
    sortOrder: 0,
    _count: { children: 0, products: 7 },
  }),
  category({
    id: "c-acc-jewellery",
    name: "Jewellery",
    slug: "jewellery",
    parentId: "c-accessories",
    sortOrder: 1,
    _count: { children: 0, products: 6 },
  }),
];

function product(
  partial: Partial<AdminProductListItem> &
    Pick<AdminProductListItem, "id" | "name" | "slug" | "status" | "category">,
): AdminProductListItem {
  return {
    isFeatured: false,
    minPrice: null,
    maxPrice: null,
    totalStock: 0,
    soldCount: 0,
    avgRating: 0,
    reviewCount: 0,
    brand: null,
    seller: null,
    images: [],
    _count: { variants: 0, images: 0 },
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

const catWomen = { id: "c-women", name: "Women's Wear", slug: "womens-wear" };
const catSaree = { id: "c-women-saree", name: "Sarees", slug: "sarees" };
const catMen = { id: "c-men", name: "Men's Wear", slug: "mens-wear" };
const catPanjabi = { id: "c-men-panjabi", name: "Panjabi", slug: "panjabi" };
const catKurti = { id: "c-women-kurti", name: "Kurtis", slug: "kurtis" };

export const mockAdminProducts: AdminProductListItem[] = [
  product({
    id: "p1",
    name: "Scarlet Taffeta Party Gown",
    slug: "scarlet-party-gown",
    status: "ACTIVE",
    category: catWomen,
    isFeatured: true,
    minPrice: "5900",
    maxPrice: "5900",
    totalStock: 18,
    soldCount: 890,
    avgRating: 4.8,
    reviewCount: 214,
    images: [
      {
        id: "i1",
        url: "/images/products/scarlet-party-gown.jpg",
        alt: "Scarlet Taffeta Party Gown",
        isPrimary: true,
      },
    ],
    _count: { variants: 6, images: 4 },
    createdAt: "2026-07-15T00:00:00.000Z",
  }),
  product({
    id: "p2",
    name: "Sky Blue Dotted Wrap Maxi",
    slug: "sky-wrap-maxi-dress",
    status: "ACTIVE",
    category: catWomen,
    isFeatured: true,
    minPrice: "3450",
    maxPrice: "3450",
    totalStock: 26,
    soldCount: 421,
    avgRating: 4.7,
    reviewCount: 167,
    images: [
      {
        id: "i2",
        url: "/images/products/sky-wrap-maxi-dress.jpg",
        alt: "Sky Blue Dotted Wrap Maxi",
        isPrimary: true,
      },
    ],
    _count: { variants: 4, images: 3 },
    createdAt: "2026-07-12T00:00:00.000Z",
  }),
  product({
    id: "p3",
    name: "Ivory Floral Wrap Dress",
    slug: "ivory-floral-wrap-dress",
    status: "ACTIVE",
    category: catWomen,
    minPrice: "2890",
    maxPrice: "2990",
    totalStock: 42,
    soldCount: 640,
    avgRating: 4.6,
    reviewCount: 128,
    images: [
      {
        id: "i3",
        url: "/images/products/ivory-floral-wrap-dress.jpg",
        alt: "Ivory Floral Wrap Dress",
        isPrimary: true,
      },
    ],
    _count: { variants: 5, images: 5 },
    createdAt: "2026-07-18T00:00:00.000Z",
  }),
  product({
    id: "p4",
    name: "Chambray Printed Casual Shirt",
    slug: "chambray-casual-shirt",
    status: "ACTIVE",
    category: catMen,
    minPrice: "1650",
    maxPrice: "1750",
    totalStock: 90,
    soldCount: 388,
    avgRating: 4.4,
    reviewCount: 73,
    images: [
      {
        id: "i4",
        url: "/images/products/chambray-casual-shirt.jpg",
        alt: "Chambray Printed Casual Shirt",
        isPrimary: true,
      },
    ],
    _count: { variants: 8, images: 3 },
    createdAt: "2026-07-20T00:00:00.000Z",
  }),
  product({
    id: "p5",
    name: "Midnight Silk Jamdani Saree",
    slug: "midnight-silk-jamdani-saree",
    status: "PENDING_APPROVAL",
    category: catSaree,
    seller: { id: "s1", shopName: "Tangail Tantghor", code: "SLR-0007" },
    minPrice: "8900",
    maxPrice: "8900",
    totalStock: 12,
    _count: { variants: 2, images: 2 },
    createdAt: "2026-07-27T00:00:00.000Z",
  }),
  product({
    id: "p6",
    name: "Emerald Festive Panjabi",
    slug: "emerald-festive-panjabi",
    status: "DRAFT",
    category: catPanjabi,
    minPrice: null,
    maxPrice: null,
    totalStock: 0,
    _count: { variants: 0, images: 1 },
    createdAt: "2026-07-29T00:00:00.000Z",
  }),
  product({
    id: "p7",
    name: "Block Print Cotton Kurti",
    slug: "block-print-cotton-kurti",
    status: "OUT_OF_STOCK",
    category: catKurti,
    minPrice: "1450",
    maxPrice: "1550",
    totalStock: 0,
    soldCount: 512,
    avgRating: 4.5,
    reviewCount: 96,
    _count: { variants: 4, images: 4 },
    createdAt: "2026-06-30T00:00:00.000Z",
  }),
  product({
    id: "p8",
    name: "Slim Fit Formal Shirt",
    slug: "slim-fit-formal-shirt",
    status: "INACTIVE",
    category: catMen,
    minPrice: "1950",
    maxPrice: "1950",
    totalStock: 34,
    soldCount: 150,
    avgRating: 4.1,
    reviewCount: 28,
    _count: { variants: 6, images: 2 },
    createdAt: "2026-06-18T00:00:00.000Z",
  }),
  product({
    id: "p9",
    name: "Handloom Half Silk Saree",
    slug: "handloom-half-silk-saree",
    status: "REJECTED",
    category: catSaree,
    seller: { id: "s2", shopName: "Rupganj Weaves", code: "SLR-0011" },
    minPrice: "4200",
    maxPrice: "4200",
    totalStock: 8,
    _count: { variants: 1, images: 1 },
    createdAt: "2026-07-22T00:00:00.000Z",
  }),
  product({
    id: "p10",
    name: "Printed Georgette Three Piece",
    slug: "printed-georgette-three-piece",
    status: "ACTIVE",
    category: catWomen,
    minPrice: "3200",
    maxPrice: "3600",
    totalStock: 55,
    soldCount: 233,
    avgRating: 4.3,
    reviewCount: 51,
    _count: { variants: 9, images: 6 },
    createdAt: "2026-07-05T00:00:00.000Z",
  }),
];

export const mockAdminBrands = [
  { id: "b1", name: "Tantghor" },
  { id: "b2", name: "Deshi Dhaage" },
  { id: "b3", name: "Urban Fit" },
];

const gownVariant = {
  barcode: null,
  comparePrice: null as string | null,
  costPrice: null as string | null,
  reservedStock: 0,
  lowStockThreshold: 5,
  weight: null as string | null,
  isActive: true,
  isDefault: false,
};

/** Full edit-page shape for the party gown (`GET /admin/products/p1`). */
export const mockAdminProductDetail: AdminProductDetail = {
  ...mockAdminProducts[0],
  shortDescription:
    "Floor-length taffeta gown with a fitted bodice and sweeping A-line skirt.",
  description:
    "Cut from crisp taffeta with a subtle sheen, this party gown pairs a " +
    "boned, fitted bodice with a dramatic floor-sweeping skirt. Concealed " +
    "back zip, fully lined. Made in Dhaka.",
  videoUrl: null,
  specifications: {
    Fabric: "Taffeta",
    Lining: "Full viscose lining",
    Care: "Dry clean only",
    Origin: "Bangladesh",
  },
  tags: ["party", "gown", "occasion wear"],
  rejectionReason: null,
  metaTitle: null,
  metaDescription: null,
  metaKeywords: null,
  options: [
    {
      id: "po1",
      optionId: "opt-color",
      name: "Color",
      displayType: "SWATCH",
      sortOrder: 0,
      values: [
        { id: "ov-red", value: "Red", hexColor: "#b91c1c", sortOrder: 0 },
        { id: "ov-navy", value: "Navy", hexColor: "#1e3a5f", sortOrder: 1 },
      ],
    },
    {
      id: "po2",
      optionId: "opt-size",
      name: "Size",
      displayType: "BUTTON",
      sortOrder: 1,
      values: [
        { id: "ov-s", value: "S", hexColor: null, sortOrder: 0 },
        { id: "ov-m", value: "M", hexColor: null, sortOrder: 1 },
        { id: "ov-l", value: "L", hexColor: null, sortOrder: 2 },
      ],
    },
  ],
  variants: [
    {
      ...gownVariant,
      id: "var1",
      name: "Red / S",
      sku: "GOWN-RED-S",
      price: "5900",
      comparePrice: "7200",
      stock: 6,
      sortOrder: 0,
      isDefault: true,
    },
    {
      ...gownVariant,
      id: "var2",
      name: "Red / M",
      sku: "GOWN-RED-M",
      price: "5900",
      comparePrice: "7200",
      stock: 0,
      sortOrder: 1,
    },
    {
      ...gownVariant,
      id: "var3",
      name: "Red / L",
      sku: "GOWN-RED-L",
      price: "5900",
      comparePrice: "7200",
      stock: 4,
      sortOrder: 2,
    },
    {
      ...gownVariant,
      id: "var4",
      name: "Navy / S",
      sku: "GOWN-NVY-S",
      price: "6100",
      stock: 3,
      sortOrder: 3,
    },
    {
      ...gownVariant,
      id: "var5",
      name: "Navy / M",
      sku: "GOWN-NVY-M",
      price: "6100",
      stock: 5,
      sortOrder: 4,
    },
    {
      ...gownVariant,
      id: "var6",
      name: "Navy / L",
      sku: "GOWN-NVY-L",
      price: "6100",
      stock: 0,
      sortOrder: 5,
      isActive: false,
    },
  ],
  images: [
    {
      id: "img1",
      url: "/images/products/scarlet-party-gown.jpg",
      publicId: null,
      alt: "Scarlet gown, front",
      optionValueId: "ov-red",
      sortOrder: 0,
      isPrimary: true,
    },
    {
      id: "img2",
      url: "/images/products/ivory-floral-wrap-dress.jpg",
      publicId: null,
      alt: "Detail of the bodice",
      optionValueId: "ov-red",
      sortOrder: 1,
      isPrimary: false,
    },
    {
      id: "img3",
      url: "/images/products/sky-wrap-maxi-dress.jpg",
      publicId: null,
      alt: "Navy colourway",
      optionValueId: "ov-navy",
      sortOrder: 2,
      isPrimary: false,
    },
    {
      id: "img4",
      url: "/images/products/chambray-casual-shirt.jpg",
      publicId: null,
      alt: "Fabric close-up",
      optionValueId: null,
      sortOrder: 3,
      isPrimary: false,
    },
  ],
};
