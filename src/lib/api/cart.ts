import { mockProducts } from "./mock/home-data";

/**
 * Cart contents for the current shopper. Mock-backed for now — the body
 * swaps to `fetch()` when the real backend lands (same shape as `nav.ts`).
 */

export interface CartLine {
  id: string;
  productId: string;
  slug: string;
  title: string;
  categoryName: string;
  image: string | null;
  /** Chosen variant, e.g. "Size M · Scarlet". */
  variantLabel: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  /** Stock of the chosen variant — caps the quantity stepper. */
  stock: number;
  quantity: number;
}

const LINES = [
  { productId: "p1", variantLabel: "Size M · Scarlet", stock: 3, quantity: 1 },
  { productId: "p5", variantLabel: "Size L · Charcoal", stock: 24, quantity: 2 },
  { productId: "p7", variantLabel: "Size 42 · Crimson", stock: 8, quantity: 1 },
];

export async function getCart(): Promise<CartLine[]> {
  return LINES.flatMap((line, index) => {
    const product = mockProducts.find((p) => p.id === line.productId);
    if (!product) return [];
    return [
      {
        id: `cl${index + 1}`,
        productId: product.id,
        slug: product.slug,
        title: product.title,
        categoryName: product.category.name,
        image: product.image,
        variantLabel: line.variantLabel,
        unitPrice: product.minPrice,
        compareAtPrice: product.comparePrice,
        stock: line.stock,
        quantity: line.quantity,
      },
    ];
  });
}
