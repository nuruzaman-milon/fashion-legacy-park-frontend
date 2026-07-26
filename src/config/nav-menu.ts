/**
 * Declarative config for the desktop mega menu. Subcategories don't exist
 * in the catalog model yet, so panel columns are hand-curated here; hrefs
 * point at the category-filtered products listing. `productsFrom` names the
 * category slugs whose newest products fill the panel's NEW ARRIVALS grid
 * (resolved on the server in `src/lib/api/nav.ts`).
 */

export interface NavColumn {
  title: string;
  links: { label: string; href: string }[];
}

export type NavMenuItemConfig =
  | { type: "link"; label: string; href: string; highlight?: boolean }
  | {
      type: "mega";
      label: string;
      /** "View All …" target. */
      href: string;
      columns: NavColumn[];
      /** Category slugs to source the NEW ARRIVALS grid from. */
      productsFrom: string[];
    };

const sub = (category: string, type: string) =>
  `/products?category=${category}&type=${type}`;

export const navMenuConfig: NavMenuItemConfig[] = [
  { type: "link", label: "New In", href: "/products?sort=newest" },
  {
    type: "mega",
    label: "Women",
    href: "/products?category=womens-wear",
    columns: [
      {
        title: "Clothing",
        links: [
          { label: "Tops", href: sub("womens-wear", "tops") },
          { label: "T-Shirts", href: sub("womens-wear", "t-shirts") },
          { label: "Shirts", href: sub("womens-wear", "shirts") },
          { label: "Dresses", href: sub("womens-wear", "dresses") },
          { label: "Jeans", href: sub("womens-wear", "jeans") },
          { label: "Pants", href: sub("womens-wear", "pants") },
          { label: "Jackets & Blazers", href: sub("womens-wear", "jackets") },
          { label: "Knitwear", href: sub("womens-wear", "knitwear") },
          { label: "Sarees & Ethnic", href: "/products?category=sarees-ethnic" },
        ],
      },
      {
        title: "Footwear",
        links: [
          { label: "Sneakers", href: sub("footwear", "sneakers") },
          { label: "Flats", href: sub("footwear", "flats") },
          { label: "Heels", href: sub("footwear", "heels") },
          { label: "Sandals", href: sub("footwear", "sandals") },
          { label: "Boots", href: sub("footwear", "boots") },
        ],
      },
      {
        title: "Accessories",
        links: [
          { label: "Bags", href: sub("accessories", "bags") },
          { label: "Watches", href: sub("accessories", "watches") },
          { label: "Sunglasses", href: sub("accessories", "sunglasses") },
          { label: "Jewelry", href: sub("accessories", "jewelry") },
          { label: "Scarves", href: sub("accessories", "scarves") },
          { label: "Belts", href: sub("accessories", "belts") },
          { label: "Wallets", href: sub("accessories", "wallets") },
        ],
      },
    ],
    productsFrom: ["womens-wear", "cosmetics"],
  },
  {
    type: "mega",
    label: "Men",
    href: "/products?category=mens-wear",
    columns: [
      {
        title: "Clothing",
        links: [
          { label: "T-Shirts", href: sub("mens-wear", "t-shirts") },
          { label: "Polos", href: sub("mens-wear", "polos") },
          { label: "Shirts", href: sub("mens-wear", "shirts") },
          { label: "Panjabi", href: sub("mens-wear", "panjabi") },
          { label: "Jeans", href: sub("mens-wear", "jeans") },
          { label: "Trousers", href: sub("mens-wear", "trousers") },
          { label: "Jackets", href: sub("mens-wear", "jackets") },
          { label: "Sweaters", href: sub("mens-wear", "sweaters") },
        ],
      },
      {
        title: "Footwear",
        links: [
          { label: "Sneakers", href: sub("footwear", "sneakers") },
          { label: "Loafers", href: sub("footwear", "loafers") },
          { label: "Formal Shoes", href: sub("footwear", "formal") },
          { label: "Sandals", href: sub("footwear", "sandals") },
          { label: "Boots", href: sub("footwear", "boots") },
        ],
      },
      {
        title: "Accessories",
        links: [
          { label: "Watches", href: sub("accessories", "watches") },
          { label: "Belts", href: sub("accessories", "belts") },
          { label: "Wallets", href: sub("accessories", "wallets") },
          { label: "Sunglasses", href: sub("accessories", "sunglasses") },
          { label: "Caps", href: sub("accessories", "caps") },
        ],
      },
    ],
    productsFrom: ["mens-wear", "footwear"],
  },
  {
    type: "mega",
    label: "Kids",
    href: "/products?category=kids",
    columns: [
      {
        title: "Clothing",
        links: [
          { label: "T-Shirts", href: sub("kids", "t-shirts") },
          { label: "Sets & Frocks", href: sub("kids", "sets") },
          { label: "Sweaters", href: sub("kids", "sweaters") },
          { label: "School Wear", href: sub("kids", "school") },
          { label: "Ethnic Wear", href: sub("kids", "ethnic") },
        ],
      },
      {
        title: "Footwear",
        links: [
          { label: "Sneakers", href: sub("footwear", "kids-sneakers") },
          { label: "Sandals", href: sub("footwear", "kids-sandals") },
          { label: "School Shoes", href: sub("footwear", "school-shoes") },
        ],
      },
      {
        title: "Essentials",
        links: [
          { label: "Backpacks", href: sub("accessories", "backpacks") },
          { label: "Caps", href: sub("accessories", "caps") },
          { label: "Socks", href: sub("accessories", "socks") },
        ],
      },
    ],
    productsFrom: ["footwear"],
  },
  {
    type: "mega",
    label: "Accessories",
    href: "/products?category=accessories",
    columns: [
      {
        title: "Bags",
        links: [
          { label: "Handbags", href: sub("accessories", "handbags") },
          { label: "Backpacks", href: sub("accessories", "backpacks") },
          { label: "Wallets", href: sub("accessories", "wallets") },
        ],
      },
      {
        title: "Jewelry & Watches",
        links: [
          { label: "Watches", href: sub("accessories", "watches") },
          { label: "Earrings", href: sub("accessories", "earrings") },
          { label: "Necklaces", href: sub("accessories", "necklaces") },
          { label: "Rings", href: sub("accessories", "rings") },
        ],
      },
      {
        title: "More",
        links: [
          { label: "Sunglasses", href: sub("accessories", "sunglasses") },
          { label: "Belts", href: sub("accessories", "belts") },
          { label: "Scarves", href: sub("accessories", "scarves") },
          { label: "Caps", href: sub("accessories", "caps") },
        ],
      },
    ],
    productsFrom: ["cosmetics", "footwear"],
  },
  { type: "link", label: "Sale", href: "/products?sale=1", highlight: true },
];
