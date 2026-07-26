export const siteConfig = {
  name: "Fashion Legacy",
  tagline: "Fashion for every day in Bangladesh",
  description:
    "Curated everyday fashion for women, men and kids — delivered anywhere in Bangladesh. Cash on delivery, bKash and easy 7-day returns.",
  url: "https://fashionlegacy.com",

  mainNav: [
    { label: "New In", href: "/products?sort=newest" },
    { label: "Women", href: "/products?category=womens-wear" },
    { label: "Men", href: "/products?category=mens-wear" },
    { label: "Kids", href: "/products?category=kids" },
    { label: "Accessories", href: "/products?category=accessories" },
    { label: "Sale", href: "/products?sale=1", highlight: true },
  ] as { label: string; href: string; highlight?: boolean }[],

  footerNav: {
    shop: [
      { label: "New arrivals", href: "/products?sort=newest" },
      { label: "Best sellers", href: "/products?sort=best-selling" },
      { label: "Women's wear", href: "/products?category=womens-wear" },
      { label: "Men's wear", href: "/products?category=mens-wear" },
      { label: "Flash sale", href: "/products?sale=1" },
    ],
    help: [
      { label: "Track your order", href: "/account/orders" },
      { label: "Returns & refund policy", href: "/pages/refund-policy" },
      { label: "Terms of service", href: "/pages/terms" },
      { label: "Privacy policy", href: "/pages/privacy" },
    ],
  },

  contact: {
    phone: "+880 1700-000000",
    email: "support@fashionlegacy.com",
    address: "House 12, Road 5, Dhanmondi, Dhaka 1205",
    hours: "Sat–Thu, 10am–8pm",
  },

  social: [
    { label: "Facebook", href: "https://facebook.com/fashionlegacy" },
    { label: "Instagram", href: "https://instagram.com/fashionlegacy" },
    { label: "TikTok", href: "https://tiktok.com/@fashionlegacy" },
    { label: "YouTube", href: "https://youtube.com/@fashionlegacy" },
  ],

  payments: ["Cash on Delivery", "bKash", "SSLCommerz", "Visa", "Mastercard"],
};

export type SiteConfig = typeof siteConfig;
