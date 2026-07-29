# Fashion Legacy — Storefront API: Navbar + Homepage

Backend reference for wiring the navbar/megamenu and every homepage section to
real data. All endpoints below are **public** (no auth) and **live-tested** —
the database is seeded with 53 products, 5 root categories, megamenu pins, and
one running flash sale, so every section renders with data immediately.

## Basics

- **Base URL (dev):** `http://localhost:5000/api/v1`
- **CORS:** the backend allows origin `http://localhost:3001` only (with
  credentials). Run the frontend dev server on port 3001, or change
  `CLIENT_URL` in the backend `.env`.
- **Response envelope** — every endpoint wraps its payload:

  ```json
  { "success": true, "message": "…", "data": <payload> }
  ```

  Errors: `{ "success": false, "message": "…" }` (+ an `errors` array of Zod
  issues on 400 validation failures).
- **Money is a string**, not a number — Prisma Decimal serializes as `"2500"`
  or `"1500.00"`. Parse with `Number()` before math, display as `৳` BDT.
- **Dates** are ISO 8601 strings.
- **Image URLs** come in two forms in the seed data:
  - The 12 products mirrored from the old mock data use root-relative paths
    (`/images/products/scarlet-party-gown.jpg`) that already exist in this
    repo's `public/` — they render as-is.
  - Filler products use `https://picsum.photos/seed/<slug>/600/800` — add
    `picsum.photos` to `images.remotePatterns` in `next.config` if
    `next/image` is used.

---

## 1. Navbar + Megamenu — `GET /categories/menu`

One call returns the entire navbar: the active category tree (3 levels) plus
each root's admin-curated products for the megamenu panel. Replaces
`src/config/nav-menu.ts` and `src/lib/api/mock/home-data.ts` categories.

```json
{
  "data": [
    {
      "id": "…", "name": "Women", "slug": "womens-wear",
      "icon": null, "image": null, "sortOrder": 1,
      "productCount": 18,
      "children": [
        {
          "name": "Clothing", "slug": "womens-clothing", "productCount": 9,
          "children": [
            { "name": "Tops", "slug": "womens-tops", "productCount": 2, "children": [] },
            { "name": "Sarees & Ethnic", "slug": "sarees-ethnic", "…": "…" }
          ]
        },
        { "name": "Footwear", "slug": "womens-footwear", "…": "…" },
        { "name": "Accessories", "slug": "womens-accessories", "…": "…" }
      ],
      "recommendedProducts": [
        {
          "id": "…", "name": "Scarlet Taffeta Party Gown",
          "slug": "scarlet-party-gown",
          "minPrice": "5900", "maxPrice": "5900", "avgRating": 4.8,
          "images": [{ "url": "/images/products/scarlet-party-gown.jpg", "alt": "…" }]
        }
      ]
    }
  ]
}
```

Mapping to the megamenu design:

- **Roots** (Women, Men, Kids, Accessories, Cosmetics) → top navbar items, in
  `sortOrder`. **Cosmetics is new** — it did not exist in the static config.
- **Level 2** (`children`) → megamenu columns (Clothing / Footwear / …).
- **Level 3** → the links inside each column.
- **`recommendedProducts`** → the panel on the right. The section heading
  (e.g. **"Our Recommendation"**) is hardcoded in the frontend — it is
  admin-curated, NOT new arrivals. An empty array means hide the panel.
- Every link goes to `/products?category=<slug>` — the old
  `&type=` parameter is gone; the backend category filter now matches the
  whole subtree, so `?category=womens-wear` includes products on any leaf
  under Women.
- **"New In"** (`/products?sort=newest`) and **"Sale"** (`/products?sale=1`)
  stay hardcoded — they are filter shortcuts, not categories.

## 2. Hero banner — `GET /banners`

Active banners sorted by `sortOrder`. First one is the hero; the array may
hold more for a carousel. **Currently the table is empty** — the hero needs a
fallback (keep the static one) until a banner is created via the admin panel.

```json
{
  "data": [
    {
      "id": "…",
      "eyebrow": "Winter Collection · 2026",
      "title": "This winter, wear your legacy",
      "subtitle": "Sherpa-lined corduroy…",
      "desktopImageUrl": "https://…", "mobileImageUrl": null,
      "imageAlt": "…",
      "supportingImages": [{ "src": "https://…", "alt": "…" }],
      "buttonText": "Shop winter collection",
      "buttonLink": "/products?category=womens-wear",
      "sortOrder": 0, "isActive": true
    }
  ]
}
```

## 3. Category strip — `GET /categories/featured`

Admin-curated "Shop by category" tiles, in curated order. Deliberately
sub-categories, not roots — the roots already live in the navbar.

```json
{
  "data": [
    {
      "id": "…", "name": "Sarees & Ethnic", "slug": "sarees-ethnic",
      "icon": null, "image": "https://picsum.photos/seed/sarees-ethnic/600/750",
      "rootName": "Women",
      "productCount": 2, "homeSortOrder": 0
    }
  ]
}
```

- **Curation**: `Category.showOnHome` + `homeSortOrder`, set via
  `PATCH /admin/categories/:id`. Seeded by `prisma/seed-featured.js` (8 tiles).
- **`rootName`** is the top-level ancestor ("Women", "Men", …) — label tiles
  with it, since both Women and Men have a "Clothing"/"Sneakers".
- `productCount` aggregates over the subtree, visible products only. A
  category under a deactivated parent drops out, same rule as the tree.
- **Empty array** until an admin curates — fall back to the top level of
  `GET /categories/tree` (same fields minus `rootName`).

## 4. Flash sale — `GET /flash-sales/active`

The sale that is live right now, or **`data: null`** (still HTTP 200) when
none is — hide the section then. Seeded: **"Weekend Flash Deals"**, live for
7 days from seed time, 6 items.

```json
{
  "data": {
    "id": "…", "title": "Weekend Flash Deals",
    "description": "…", "banner": null,
    "startsAt": "2026-07-29T…", "endsAt": "2026-08-05T…",
    "items": [
      {
        "variantId": "…", "variantName": "Default",
        "price": "5900", "comparePrice": "7200",
        "flashPrice": "4720.00",
        "quantityLimit": 50, "soldCount": 0, "remaining": 50,
        "available": 18,
        "product": {
          "id": "…", "name": "Scarlet Taffeta Party Gown",
          "slug": "scarlet-party-gown", "avgRating": 4.8, "reviewCount": 214,
          "images": [{ "url": "…", "alt": "…" }]
        }
      }
    ]
  }
}
```

- Countdown timer runs against `endsAt`.
- Card shows `flashPrice` with `price` struck through.
- Progress bar: `soldCount` / `quantityLimit` (`quantityLimit` can be null =
  uncapped; `remaining` is precomputed).
- `available` is real purchasable stock for the variant.

## 5. Product rails — `GET /products`

All three homepage rails are the same endpoint with different params:

| Rail | Query |
|---|---|
| Featured products | `/products?isFeatured=true&limit=8` |
| New arrivals | `/products?sort=newest&limit=8` |
| Best sellers | `/products?sort=best-selling&limit=8` |

Card item shape (matches the old `ProductListItem` mock closely — note
`name` not `title`, and `images[0]` not `image`):

```json
{
  "data": {
    "items": [
      {
        "id": "…", "name": "Scarlet Taffeta Party Gown",
        "slug": "scarlet-party-gown", "shortDescription": "…",
        "minPrice": "5900", "maxPrice": "5900", "comparePrice": "7200",
        "totalStock": 18, "avgRating": 4.8, "reviewCount": 214,
        "soldCount": 890, "isFeatured": true, "status": "ACTIVE",
        "publishedAt": "2026-07-15T00:00:00.000Z",
        "category": { "id": "…", "name": "Dresses", "slug": "womens-dresses" },
        "brand": null,
        "images": [{ "url": "/images/products/scarlet-party-gown.jpg", "alt": "…" }]
      }
    ],
    "meta": { "page": 1, "limit": 8, "total": 53, "totalPages": 7, "hasNext": true, "hasPrev": false }
  }
}
```

- `comparePrice` (nullable) → strikethrough price; discount % can be computed
  from it.
- "New" badge: derive from `publishedAt` (e.g. within 14 days).
- `status` can also be `OUT_OF_STOCK` — such products are listed but not
  buyable.

## 6. Products listing page — `GET /products` (full params)

The page megamenu links land on. All params combine freely:

| Param | Values | Notes |
|---|---|---|
| `categorySlug` | e.g. `womens-wear`, `womens-tops` | **Matches the whole subtree** — a root slug returns everything under it. Use this for the `?category=` URL param. |
| `categoryId` | id | Same subtree behavior. |
| `brandSlug` / `brandId` | | |
| `search` | text | Matches name / shortDescription / tags. |
| `minPrice` / `maxPrice` | number | Applied to the card's "from" price. |
| `inStock` | `true` | Only products with stock. |
| `isFeatured` | `true` \| `false` | |
| `tag` | text | |
| `sort` | `newest` (default) \| `price-asc` \| `price-desc` \| `rating` \| `best-selling` | |
| `page` / `limit` | numbers | Pagination, `meta` in response. |

Unknown category slug returns an empty list, not an error.

## 7. Product detail — `GET /products/:slug`

For the product page (later phase, documented for completeness). Returns
everything §5 has plus `description`, `specifications`, `tags`, full `images`
array, `productOptions` (option rows in render order, e.g. Size with values
S/M/L/XL), and `variants` — each with `price`, `comparePrice`, `available`
(purchasable stock), `isDefault`, and `valueIds` linking it to option values.
`inStockValueIds` lets the picker grey out sold-out values. Seeded products
`ivory-floral-wrap-dress`, `chambray-casual-shirt`, `midnight-slim-blazer`
have real Size variants with different prices for testing the picker.

---

## Suggested homepage data flow

```
GET /categories/menu      → navbar + megamenu (fetch once, cache client-side)
GET /banners              → hero (fallback to static if empty)
GET /categories/tree      → category strip (roots only)
GET /flash-sales/active   → flash sale section (hide when data === null)
GET /products?isFeatured=true&limit=8
GET /products?sort=newest&limit=8
GET /products?sort=best-selling&limit=8
```

All seven are independent — fetch in parallel. Delete
`src/lib/api/mock/home-data.ts` and `src/config/nav-menu.ts` once wired.
