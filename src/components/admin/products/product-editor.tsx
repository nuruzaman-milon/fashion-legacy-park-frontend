"use client";

import * as React from "react";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { useCatalogSurface } from "@/components/admin/products/catalog-surface";
import { ImagesSection } from "@/components/admin/products/images-section";
import { ProductForm } from "@/components/admin/products/product-form";
import { VariantsSection } from "@/components/admin/products/variants-section";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import type { AdminProductDetail } from "@/types/admin";

/**
 * The edit page: one fetch of `GET /admin/products/:id`, then the form and
 * the images/variants sections share this state — attaching an option must
 * immediately show up in the photo-scope picker, so it lives here, not in
 * either section.
 */
export function ProductEditor({ productId }: { productId: string }) {
  const { api, basePath } = useCatalogSurface();
  const [detail, setDetail] = React.useState<AdminProductDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    api.getProduct(productId)
      .then((product) => {
        if (!cancelled) setDetail(product);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError && err.status === 404
              ? "This product no longer exists."
              : err instanceof ApiError
                ? err.message
                : "Could not load the product. Please try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productId, api]);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Edit product" />
        <FormAlert>{error}</FormAlert>
        <Button variant="outline" render={<Link href={basePath} />}>
          Back to products
        </Button>
      </div>
    );
  }

  if (detail === null) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title={detail.name} description={`/${detail.slug}`}>
        <Button
          variant="outline"
          render={<Link href={`/products/${detail.slug}`} target="_blank" />}
        >
          <ExternalLinkIcon data-icon="inline-start" />
          View in store
        </Button>
      </PageHeader>
      <ProductForm initial={detail} />
      <ImagesSection
        productId={productId}
        images={detail.images}
        options={detail.options}
        onImagesChange={(images) =>
          setDetail((d) => (d ? { ...d, images } : d))
        }
      />
      <VariantsSection
        productId={productId}
        options={detail.options}
        variants={detail.variants}
        onOptionsChange={(options) =>
          setDetail((d) => (d ? { ...d, options } : d))
        }
        onVariantsChange={(variants) =>
          setDetail((d) => (d ? { ...d, variants } : d))
        }
      />
    </>
  );
}
