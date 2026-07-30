"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as z from "zod";

import { ProductStatusBadge } from "@/components/admin/products/product-status-badge";
import { FieldError } from "@/components/auth/field-error";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getAdminBrands } from "@/lib/api/admin/brands";
import {
  categoryPathLabel,
  getAdminCategories,
} from "@/lib/api/admin/categories";
import {
  createProduct,
  setProductStatus,
  updateProduct,
  type ProductPayload,
} from "@/lib/api/admin/products";
import { ApiError } from "@/lib/api/client";
import type { AdminProductDetail, ProductStatus } from "@/types/admin";

/** Mirrors the backend's product create/update schema. */
const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(200, "At most 200 characters"),
  slug: z
    .string()
    .trim()
    .max(120, "At most 120 characters")
    .regex(/^[\p{L}\p{N}-]+$/u, "Only letters, numbers and dashes")
    .optional()
    .or(z.literal("")),
  shortDescription: z.string().trim().max(500, "At most 500 characters"),
  description: z.string().trim().max(20000, "At most 20,000 characters"),
  videoUrl: z
    .union([z.literal(""), z.url("Enter a full URL, e.g. https://…")])
    .optional(),
  categoryId: z.string().min(1, "Pick a category"),
  tags: z.array(z.string()).max(30, "At most 30 tags"),
  metaTitle: z.string().trim().max(160, "At most 160 characters"),
  metaDescription: z.string().trim().max(320, "At most 320 characters"),
  metaKeywords: z.string().trim().max(255, "At most 255 characters"),
});

const NONE = "__none__";

/** What `PATCH /admin/products/:id/status` accepts from an admin. */
const SETTABLE_STATUSES: ProductStatus[] = [
  "DRAFT",
  "ACTIVE",
  "INACTIVE",
  "REJECTED",
];

const STATUS_LABEL: Record<ProductStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending approval",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  REJECTED: "Rejected",
  OUT_OF_STOCK: "Out of stock",
};

interface FormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  saved?: boolean;
}

function FormSkeleton() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_18rem]">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-28 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Create (`initial` absent — POSTs a draft, then jumps to its edit page where
 * photos and variants live) or edit (PATCH; a status change goes through the
 * separate admin-only status endpoint).
 */
export function ProductForm({ initial }: { initial?: AdminProductDetail }) {
  const router = useRouter();

  const [pickers, setPickers] = React.useState<{
    categories: { value: string; label: string }[];
    brands: { value: string; label: string }[];
  } | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([getAdminCategories(), getAdminBrands()])
      .then(([categories, brands]) => {
        if (cancelled) return;
        setPickers({
          categories: categories.map((c) => ({
            value: c.id,
            label: categoryPathLabel(c, categories),
          })),
          brands: [
            { value: NONE, label: "No brand" },
            ...brands
              .filter((b) => b.isActive)
              .map((b) => ({ value: b.id, label: b.name })),
          ],
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError
              ? err.message
              : "Could not load the form. Please try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Controlled throughout — a failed save never wipes the edits.
  const [values, setValues] = React.useState(() => ({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    videoUrl: initial?.videoUrl ?? "",
    categoryId: initial?.category.id ?? "",
    brandId: initial?.brand?.id ?? null,
    isFeatured: initial?.isFeatured ?? false,
    tags: (initial?.tags ?? []).join(", "),
    status: initial?.status ?? ("DRAFT" as ProductStatus),
    rejectionReason: initial?.rejectionReason ?? "",
    metaTitle: initial?.metaTitle ?? "",
    metaDescription: initial?.metaDescription ?? "",
    metaKeywords: initial?.metaKeywords ?? "",
  }));

  const set = <K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  const statusItems = React.useMemo(() => {
    const statuses = SETTABLE_STATUSES.includes(values.status)
      ? SETTABLE_STATUSES
      : [values.status, ...SETTABLE_STATUSES];
    return statuses.map((s) => ({ value: s, label: STATUS_LABEL[s] }));
  }, [values.status]);

  const [state, formAction, pending] = React.useActionState<
    FormState | undefined,
    FormData
  >(async () => {
    const parsed = productSchema.safeParse({
      ...values,
      tags: values.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
    if (!parsed.success) {
      return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }
    const trimOrNull = (s: string) => {
      const t = s.trim();
      return t === "" ? null : t;
    };

    const payload: ProductPayload = {
      name: parsed.data.name,
      shortDescription: trimOrNull(values.shortDescription),
      description: trimOrNull(values.description),
      videoUrl: trimOrNull(values.videoUrl),
      categoryId: values.categoryId,
      brandId: values.brandId,
      isFeatured: values.isFeatured,
      tags: parsed.data.tags,
      metaTitle: trimOrNull(values.metaTitle),
      metaDescription: trimOrNull(values.metaDescription),
      metaKeywords: trimOrNull(values.metaKeywords),
    };
    const slug = values.slug.trim();
    if (slug) payload.slug = slug;

    try {
      if (!initial) {
        const created = await createProduct({
          ...payload,
          name: parsed.data.name,
          categoryId: values.categoryId,
        });
        router.push(`/admin/products/${created.id}/edit`);
        return undefined;
      }

      await updateProduct(initial.id, payload);
      if (
        values.status !== initial.status &&
        SETTABLE_STATUSES.includes(values.status)
      ) {
        await setProductStatus(
          initial.id,
          values.status as "DRAFT" | "ACTIVE" | "INACTIVE" | "REJECTED",
          values.status === "REJECTED"
            ? values.rejectionReason.trim() || undefined
            : undefined,
        );
      }
      return { saved: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return { formError: error.message, fieldErrors: error.fieldErrors };
      }
      return { formError: "Something went wrong. Please try again." };
    }
  }, undefined);

  if (loadError) return <FormAlert>{loadError}</FormAlert>;
  if (pickers === null) return <FormSkeleton />;

  return (
    <form
      action={formAction}
      className="grid items-start gap-6 lg:grid-cols-[1fr_18rem]"
    >
      <div className="flex min-w-0 flex-col gap-6">
        {state?.saved && (
          <FormAlert tone="success">Product saved.</FormAlert>
        )}
        {state?.formError && <FormAlert>{state.formError}</FormAlert>}
        {!initial && (
          <FormAlert tone="info">
            New products are created as drafts. Variants and photos are added
            after the first save.
          </FormAlert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="prod-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="prod-name"
                required
                className="h-10"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.name} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prod-slug" className="text-sm font-medium">
                Slug{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="prod-slug"
                className="h-10 font-mono text-sm"
                placeholder="auto-generated"
                value={values.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.slug} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prod-short" className="text-sm font-medium">
                Short description{" "}
                <span className="font-normal text-muted-foreground">
                  ({values.shortDescription.length}/500)
                </span>
              </label>
              <Textarea
                id="prod-short"
                className="min-h-16"
                value={values.shortDescription}
                onChange={(e) => set("shortDescription", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.shortDescription} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prod-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="prod-description"
                className="min-h-32"
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.description} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="prod-tags" className="text-sm font-medium">
                  Tags
                </label>
                <Input
                  id="prod-tags"
                  className="h-10"
                  placeholder="party, gown, occasion wear"
                  value={values.tags}
                  onChange={(e) => set("tags", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated, up to 30.
                </p>
                <FieldError messages={state?.fieldErrors?.tags} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="prod-video" className="text-sm font-medium">
                  Video URL{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <Input
                  id="prod-video"
                  type="url"
                  className="h-10"
                  placeholder="https://youtube.com/…"
                  value={values.videoUrl}
                  onChange={(e) => set("videoUrl", e.target.value)}
                />
                <FieldError messages={state?.fieldErrors?.videoUrl} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO</CardTitle>
            <CardDescription>
              Optional overrides for search engines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="prod-meta-title" className="text-sm font-medium">
                Meta title{" "}
                <span className="font-normal text-muted-foreground">
                  ({values.metaTitle.length}/160)
                </span>
              </label>
              <Input
                id="prod-meta-title"
                className="h-10"
                value={values.metaTitle}
                onChange={(e) => set("metaTitle", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.metaTitle} />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="prod-meta-description"
                className="text-sm font-medium"
              >
                Meta description{" "}
                <span className="font-normal text-muted-foreground">
                  ({values.metaDescription.length}/320)
                </span>
              </label>
              <Textarea
                id="prod-meta-description"
                className="min-h-16"
                value={values.metaDescription}
                onChange={(e) => set("metaDescription", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.metaDescription} />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="prod-meta-keywords"
                className="text-sm font-medium"
              >
                Meta keywords
              </label>
              <Input
                id="prod-meta-keywords"
                className="h-10"
                value={values.metaKeywords}
                onChange={(e) => set("metaKeywords", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.metaKeywords} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-20">
        {initial && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                Status
                <ProductStatusBadge status={values.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={values.status}
                items={statusItems}
                onValueChange={(v) => {
                  if (v) set("status", v);
                }}
              >
                <SelectTrigger
                  aria-label="Product status"
                  className="h-10 w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusItems.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {values.status === "REJECTED" && (
                <div className="space-y-1.5">
                  <label htmlFor="prod-reject" className="text-sm font-medium">
                    Rejection reason
                  </label>
                  <Textarea
                    id="prod-reject"
                    className="min-h-16"
                    placeholder="Shown to the seller."
                    value={values.rejectionReason}
                    onChange={(e) => set("rejectionReason", e.target.value)}
                  />
                </div>
              )}
              {initial.seller && (
                <p className="text-xs text-muted-foreground">
                  Sold by {initial.seller.shopName} ({initial.seller.code})
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Organize</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" id="prod-category-label">
                Category
              </label>
              <Select
                value={values.categoryId || null}
                items={pickers.categories}
                onValueChange={(v) => set("categoryId", v ?? "")}
              >
                <SelectTrigger
                  aria-labelledby="prod-category-label"
                  className="h-10 w-full"
                >
                  <SelectValue placeholder="Pick a category…" />
                </SelectTrigger>
                <SelectContent>
                  {pickers.categories.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError messages={state?.fieldErrors?.categoryId} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" id="prod-brand-label">
                Brand
              </label>
              <Select
                value={values.brandId ?? NONE}
                items={pickers.brands}
                onValueChange={(v) => set("brandId", v === NONE ? null : v)}
              >
                <SelectTrigger
                  aria-labelledby="prod-brand-label"
                  className="h-10 w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pickers.brands.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label
              htmlFor="prod-featured"
              className="flex cursor-pointer items-center justify-between gap-3"
            >
              <span className="text-sm">
                <span className="block font-medium">Featured</span>
                <span className="text-muted-foreground">
                  Pinned in featured rails
                </span>
              </span>
              <Switch
                id="prod-featured"
                checked={values.isFeatured}
                onCheckedChange={(checked) => set("isFeatured", checked)}
              />
            </label>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="flex-1">
            {pending
              ? "Saving…"
              : initial
                ? "Save changes"
                : "Create draft"}
          </Button>
          <Button
            type="button"
            variant="outline"
            render={<Link href="/admin/products" />}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
