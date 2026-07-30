"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as z from "zod";

import {
  emptySlot,
  ImagePicker,
  slotChanged,
} from "@/components/admin/image-picker";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  createBrand,
  getAdminBrands,
  updateBrand,
  type AdminBrand,
  type BrandPayload,
} from "@/lib/api/admin/brands";
import { uploadImage } from "@/lib/api/admin/uploads";
import { ApiError } from "@/lib/api/client";

/** Mirrors brand.validation.ts. */
const brandSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(100, "At most 100 characters"),
  slug: z
    .string()
    .trim()
    .max(80, "At most 80 characters")
    .regex(/^[\p{L}\p{N}-]+$/u, "Only letters, numbers and dashes")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(1000, "At most 1000 characters"),
  sortOrder: z.coerce.number().int("Whole numbers only"),
  metaTitle: z.string().trim().max(160, "At most 160 characters"),
  metaDescription: z.string().trim().max(320, "At most 320 characters"),
  metaKeywords: z.string().trim().max(255, "At most 255 characters"),
});

interface FormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

/**
 * Create (`brandId` absent) or edit. The edit target comes out of the full
 * admin list — same fetch the table uses, no separate detail shape to trust.
 */
export function BrandForm({ brandId }: { brandId?: string }) {
  const [brands, setBrands] = React.useState<AdminBrand[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const ready = !brandId || brands !== null;

  React.useEffect(() => {
    if (!brandId) return;
    let cancelled = false;
    getAdminBrands()
      .then((list) => {
        if (!cancelled) setBrands(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError
              ? err.message
              : "Could not load the brand. Please try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  if (loadError) return <FormAlert>{loadError}</FormAlert>;
  if (!ready) {
    return (
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_18rem]">
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  const initial = brandId
    ? brands?.find((b) => b.id === brandId)
    : undefined;
  if (brandId && !initial) {
    return <FormAlert>This brand no longer exists.</FormAlert>;
  }

  return <BrandFormInner key={brandId ?? "new"} initial={initial} />;
}

function BrandFormInner({ initial }: { initial?: AdminBrand }) {
  const router = useRouter();

  // Controlled throughout — a failed save never wipes the edits.
  const [values, setValues] = React.useState(() => ({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    sortOrder: String(initial?.sortOrder ?? 0),
    isActive: initial?.isActive ?? true,
    metaTitle: initial?.metaTitle ?? "",
    metaDescription: initial?.metaDescription ?? "",
    metaKeywords: initial?.metaKeywords ?? "",
  }));
  const [logo, setLogo] = React.useState(() =>
    emptySlot(initial?.logo ?? null),
  );

  const set = <K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  const [state, formAction, pending] = React.useActionState<
    FormState | undefined,
    FormData
  >(async () => {
    const parsed = brandSchema.safeParse(values);
    if (!parsed.success) {
      return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }
    const trimOrNull = (s: string) => {
      const t = s.trim();
      return t === "" ? null : t;
    };

    try {
      const payload: BrandPayload = {
        name: parsed.data.name,
        description: trimOrNull(values.description),
        sortOrder: parsed.data.sortOrder,
        isActive: values.isActive,
        metaTitle: trimOrNull(values.metaTitle),
        metaDescription: trimOrNull(values.metaDescription),
        metaKeywords: trimOrNull(values.metaKeywords),
      };
      const slug = values.slug.trim();
      if (slug) payload.slug = slug;

      // Untouched logo slot is omitted so the stored url + publicId survive.
      if (slotChanged(logo)) {
        if (logo.file) {
          const uploaded = await uploadImage(logo.file, "brands");
          payload.logo = uploaded.url;
          payload.logoPublicId = uploaded.publicId;
        } else {
          payload.logo = null;
          payload.logoPublicId = null;
        }
      }

      if (initial) {
        await updateBrand(initial.id, payload);
      } else {
        await createBrand({ ...payload, name: parsed.data.name });
      }
      router.push("/admin/brands");
      return undefined;
    } catch (error) {
      if (error instanceof ApiError) {
        return { formError: error.message, fieldErrors: error.fieldErrors };
      }
      return { formError: "Something went wrong. Please try again." };
    }
  }, undefined);

  return (
    <form
      action={formAction}
      className="grid items-start gap-6 lg:grid-cols-[1fr_18rem]"
    >
      <div className="flex min-w-0 flex-col gap-6">
        {state?.formError && <FormAlert>{state.formError}</FormAlert>}

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="brand-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="brand-name"
                required
                className="h-10"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.name} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="brand-slug" className="text-sm font-medium">
                Slug{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="brand-slug"
                className="h-10 font-mono text-sm"
                placeholder="auto-generated"
                value={values.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to generate from the name.
              </p>
              <FieldError messages={state?.fieldErrors?.slug} />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="brand-description"
                className="text-sm font-medium"
              >
                Description
              </label>
              <Textarea
                id="brand-description"
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.description} />
            </div>

            <ImagePicker
              id="brand-logo"
              label="Logo"
              hint="Square works best; shown on brand pages and filters."
              slot={logo}
              onChange={setLogo}
              previewClass="size-16 rounded-lg object-contain"
            />
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
              <label
                htmlFor="brand-meta-title"
                className="text-sm font-medium"
              >
                Meta title{" "}
                <span className="font-normal text-muted-foreground">
                  ({values.metaTitle.length}/160)
                </span>
              </label>
              <Input
                id="brand-meta-title"
                className="h-10"
                value={values.metaTitle}
                onChange={(e) => set("metaTitle", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.metaTitle} />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="brand-meta-description"
                className="text-sm font-medium"
              >
                Meta description{" "}
                <span className="font-normal text-muted-foreground">
                  ({values.metaDescription.length}/320)
                </span>
              </label>
              <Textarea
                id="brand-meta-description"
                className="min-h-16"
                value={values.metaDescription}
                onChange={(e) => set("metaDescription", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.metaDescription} />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="brand-meta-keywords"
                className="text-sm font-medium"
              >
                Meta keywords
              </label>
              <Input
                id="brand-meta-keywords"
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
        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              htmlFor="brand-active"
              className="flex cursor-pointer items-center justify-between gap-3"
            >
              <span className="text-sm">
                <span className="block font-medium">Active</span>
                <span className="text-muted-foreground">
                  Selectable on products
                </span>
              </span>
              <Switch
                id="brand-active"
                checked={values.isActive}
                onCheckedChange={(checked) => set("isActive", checked)}
              />
            </label>
            <div className="space-y-1.5">
              <label htmlFor="brand-sort" className="text-sm font-medium">
                Sort order
              </label>
              <Input
                id="brand-sort"
                type="number"
                className="h-10"
                value={values.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.sortOrder} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? "Saving…" : initial ? "Save changes" : "Create brand"}
          </Button>
          <Button
            type="button"
            variant="outline"
            render={<Link href="/admin/brands" />}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
