/**
 * Per-product detail config used to expand a `ProductListItem` into a full
 * `ProductDetail` (description, specs, option library entries). Mirrors what
 * the backend will assemble from Option/OptionValue/ProductVariant tables.
 */

export interface DetailConfig {
  description: string;
  specifications: Record<string, string>;
  /** Colour option values — omitted for products without a colour axis. */
  colors?: { name: string; hex: string }[];
  /** Which size scale the product uses. */
  sizes?: "apparel" | "shoes";
  /** Cosmetics-style single option group (e.g. shades). */
  shades?: string[];
}

export const APPAREL_SIZES = ["S", "M", "L", "XL"];
export const SHOE_SIZES = ["39", "40", "41", "42", "43"];

export const detailConfigs: Record<string, DetailConfig> = {
  "scarlet-party-gown": {
    description:
      "A floor-sweeping taffeta gown with a fitted bodice and a full circle skirt that moves with you. The high halter neckline keeps it elegant while the structured waist flatters every frame. Fully lined, with a concealed back zip.",
    specifications: {
      Fabric: "Premium taffeta, satin lining",
      Fit: "Fitted bodice, flared skirt",
      Length: "Floor length (132 cm)",
      Care: "Dry clean only",
      Origin: "Made in Bangladesh",
    },
    colors: [
      { name: "Scarlet", hex: "#b3122e" },
      { name: "Wine", hex: "#6d1f2c" },
      { name: "Midnight", hex: "#232a44" },
    ],
    sizes: "apparel",
  },
  "sky-wrap-maxi-dress": {
    description:
      "Breezy dotted georgette in a true wrap silhouette — adjustable tie waist, deep V neckline and a flowing maxi skirt with a front slit. Light enough for beach days, polished enough for evening plans.",
    specifications: {
      Fabric: "Dotted georgette",
      Fit: "Wrap, adjustable waist",
      Length: "Maxi (128 cm)",
      Care: "Gentle machine wash, cold",
      Origin: "Made in Bangladesh",
    },
    colors: [
      { name: "Sky Blue", hex: "#9db8d2" },
      { name: "Sage", hex: "#9db597" },
      { name: "Blush", hex: "#d9a8a8" },
    ],
    sizes: "apparel",
  },
  "ivory-floral-wrap-dress": {
    description:
      "Painted florals on soft ivory crepe. A short-sleeve wrap dress with a self-tie belt and a graceful front fall — the everyday dress that never looks like you tried too hard.",
    specifications: {
      Fabric: "Floral crepe",
      Fit: "Wrap, relaxed",
      Length: "Midi (112 cm)",
      Care: "Hand wash recommended",
      Origin: "Made in Bangladesh",
    },
    colors: [
      { name: "Ivory Floral", hex: "#efe6d8" },
      { name: "Rose Floral", hex: "#c98997" },
      { name: "Sky Floral", hex: "#a9c2d8" },
    ],
    sizes: "apparel",
  },
  "chambray-casual-shirt": {
    description:
      "Washed chambray with a subtle all-over print, mother-of-pearl buttons and a single chest pocket. Cut for an easy regular fit that works untucked with jeans or layered under a jacket.",
    specifications: {
      Fabric: "100% cotton chambray",
      Fit: "Regular",
      Collar: "Classic point",
      Care: "Machine wash warm",
      Origin: "Made in Bangladesh",
    },
    colors: [
      { name: "Chambray Blue", hex: "#7189a5" },
      { name: "Stone Grey", hex: "#9a9a92" },
      { name: "Dusty Olive", hex: "#8a8f6a" },
    ],
    sizes: "apparel",
  },
  "essential-crew-tee": {
    description:
      "The tee you will reach for every week — heavyweight combed cotton, a ribbed crew neck that holds its shape, and a clean boxy cut. Pre-shrunk and garment washed for softness from day one.",
    specifications: {
      Fabric: "220 GSM combed cotton",
      Fit: "Regular, pre-shrunk",
      Neck: "Ribbed crew",
      Care: "Machine wash",
      Origin: "Made in Bangladesh",
    },
    colors: [
      { name: "White", hex: "#f2f1ec" },
      { name: "Black", hex: "#23211f" },
      { name: "Ash Grey", hex: "#b5b3ae" },
    ],
    sizes: "apparel",
  },
  "midnight-slim-blazer": {
    description:
      "A sharply tailored two-piece in midnight black — peak lapels, a single satin-trimmed button and a lightly structured shoulder. Cut slim through the body for a modern silhouette that still moves.",
    specifications: {
      Fabric: "Poly-viscose suiting, satin trim",
      Fit: "Slim",
      Includes: "Blazer + trousers",
      Care: "Dry clean only",
      Origin: "Made in Bangladesh",
    },
    colors: [
      { name: "Midnight Black", hex: "#1c1c22" },
      { name: "Deep Navy", hex: "#232c44" },
      { name: "Charcoal", hex: "#3b3b3f" },
    ],
    sizes: "apparel",
  },
  "crimson-knit-sneakers": {
    description:
      "Feather-light knit uppers in a bold crimson, on a cushioned foam midsole built for all-day wear. Breathable, flexible and quick to break in — your everyday pair, upgraded.",
    specifications: {
      Upper: "Engineered knit",
      Sole: "Cushioned EVA foam",
      Weight: "245 g (size 41)",
      Care: "Spot clean",
      Origin: "Imported",
    },
    colors: [
      { name: "Crimson", hex: "#b3122e" },
      { name: "Jet Black", hex: "#23211f" },
      { name: "Cloud White", hex: "#eceae4" },
    ],
    sizes: "shoes",
  },
  "teal-suede-brogues": {
    description:
      "Classic wingtip brogueing on unexpected teal suede. Leather-lined with a stacked heel and a flexible rubber-injected sole — a statement shoe that stays comfortable past midnight.",
    specifications: {
      Upper: "Genuine suede",
      Lining: "Full leather",
      Sole: "Rubber-injected",
      Care: "Suede brush only",
      Origin: "Imported",
    },
    colors: [
      { name: "Teal", hex: "#4f8d87" },
      { name: "Tan", hex: "#9a6a42" },
      { name: "Slate", hex: "#5a6270" },
    ],
    sizes: "shoes",
  },
  "azure-floral-heels": {
    description:
      "Satin pumps in azure blue, printed with garden florals and finished with a sculpted 10 cm stiletto. Padded insole and a snug pointed toe — made to be seen.",
    specifications: {
      Upper: "Printed satin",
      Heel: "10 cm stiletto",
      Insole: "Cushioned",
      Care: "Spot clean",
      Origin: "Imported",
    },
    colors: [
      { name: "Azure Floral", hex: "#3f7fc1" },
      { name: "Noir Floral", hex: "#2b2b33" },
    ],
    sizes: "shoes",
  },
  "velvet-red-lip-duo": {
    description:
      "One iconic red, two finishes. A velvet-matte bullet lipstick paired with its liquid gloss twin — layer them for depth or wear them solo. Enriched with jojoba oil so lips stay soft for hours.",
    specifications: {
      Includes: "Lipstick 3.9 g + gloss 6 ml",
      Finish: "Velvet matte / high shine",
      Wear: "Up to 8 hours",
      Notes: "Paraben-free, cruelty-free",
    },
    shades: ["Rouge Icon", "Berry Crush", "Brick Rose"],
  },
  "daily-skincare-trio": {
    description:
      "Cleanse, treat, moisturise — the whole routine in three steps. A gentle gel cleanser, a lightweight treatment lotion and a rich moisturiser, formulated to work together for normal to dry skin.",
    specifications: {
      Includes: "Cleanser 80 ml + lotion 50 ml + moisturiser 50 ml",
      "Skin type": "Normal to dry",
      Notes: "Fragrance-free, dermatologist tested",
    },
  },
  "pro-makeup-collection": {
    description:
      "A studio in one flat lay — 35-shade eyeshadow palette, brush set, mascara, highlighter and more. Curated warm neutrals with a few statement pops, built for everything from daylight looks to full glam.",
    specifications: {
      Includes: "Palette, 6 brushes, mascara, highlighter, gloss",
      Palette: "35 shades, matte & shimmer",
      Notes: "Cruelty-free",
    },
  },
};

const REVIEW_POOL: {
  author: string;
  rating: number;
  comment: string;
  isVerified: boolean;
  helpfulCount: number;
  adminReply: string | null;
}[] = [
  {
    author: "Nusrat J.",
    rating: 5,
    comment:
      "Quality is honestly better than I expected at this price. Colour is exactly like the photos and delivery to Chattogram took only 3 days.",
    isVerified: true,
    helpfulCount: 24,
    adminReply:
      "Thank you Nusrat! So glad it reached you quickly — enjoy your new favourite.",
  },
  {
    author: "Rafiq H.",
    rating: 4,
    comment:
      "Very happy overall. Sizing runs slightly large so consider going one size down. Packaging was excellent.",
    isVerified: true,
    helpfulCount: 17,
    adminReply: null,
  },
  {
    author: "Maliha R.",
    rating: 5,
    comment:
      "Second time ordering from Fashion Legacy and they never disappoint. COD made it completely hassle-free.",
    isVerified: true,
    helpfulCount: 31,
    adminReply: null,
  },
  {
    author: "Tanvir A.",
    rating: 3,
    comment:
      "Product itself is good but my parcel arrived a day later than promised. Support resolved it politely though.",
    isVerified: true,
    helpfulCount: 6,
    adminReply:
      "Apologies for the delay, Tanvir — courier load was high that week. We've shared feedback with our partner.",
  },
  {
    author: "Sadia K.",
    rating: 5,
    comment:
      "Absolutely in love! Finish and stitching feel premium. Already recommended it to my sister.",
    isVerified: false,
    helpfulCount: 12,
    adminReply: null,
  },
  {
    author: "Imran C.",
    rating: 4,
    comment:
      "Solid value for money. The 7-day return policy gave me confidence to try — didn't need it in the end.",
    isVerified: true,
    helpfulCount: 9,
    adminReply: null,
  },
];

export function reviewsFor(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) % 997;
  }
  const start = hash % REVIEW_POOL.length;
  return Array.from({ length: 3 }, (_, i) => {
    const base = REVIEW_POOL[(start + i * 2) % REVIEW_POOL.length];
    return {
      ...base,
      id: `${slug}-review-${i}`,
      createdAt: `2026-0${(hash % 6) + 1}-${String((hash % 27) + 1).padStart(2, "0")}T00:00:00.000Z`,
    };
  });
}
