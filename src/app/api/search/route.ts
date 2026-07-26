import type { NextRequest } from "next/server";

import { searchProducts } from "@/lib/api/products";

const MAX_SUGGESTIONS = 6;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return Response.json({ products: [], total: 0 });

  const { products, total } = await searchProducts(q);
  return Response.json({
    products: products.slice(0, MAX_SUGGESTIONS),
    total,
  });
}
