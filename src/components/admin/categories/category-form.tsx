"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as z from "zod";

import {
  emptySlot,
  ImagePicker,
  slotChanged,
  type ImageSlot,
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
import {
  createCategory,
  getAdminCategories,
  updateCategory,
  type CategoryPayload,
} from "@/lib/api/admin/categories";
import { uploadImage } from "@/lib/api/admin/uploads";
import { ApiError } from "@/lib/api/client";
import type { AdminCategory } from "@/types/admin";

/** Mirrors the backend's create/update schema (category.validation.ts). */
const categorySchema = z.object({
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
  homeSortOrder: z.coerce.number().int("Whole numbers only"),
  metaTitle: z.string().trim().max(160, "At most 160 characters"),
  metaDescription: z.string().trim().max(320, "At most 320 characters"),
  metaKeywords: z.string().trim().max(255, "At most 255 characters"),
});

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const NO_PARENT = "__root__";

interface FormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}


function FormSkeleton() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="flex flex-col gap-6">
        {Array.from({ length: 2 }, (_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-20" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Create (`categoryId` absent) or edit. Fetches the flat admin list itself —
 * it needs it for parent options anyway, and the edit target is a row of it.
 */
export function CategoryForm({
  categoryId,
  defaultParentId = null,
}: {
  categoryId?: string;
  /** Preselects the parent when arriving via "Add subcategory". */
  defaultParentId?: string | null;
}) {
  const [categories, setCategories] = React.useState<AdminCategory[] | null>(
    null,
  );
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getAdminCategories()
      .then((list) => {
        if (!cancelled) setCategories(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError
              ? err.message
              : "Could not load categories. Please try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) return <FormAlert>{loadError}</FormAlert>;
  if (categories === null) return <FormSkeleton />;

  const initial = categoryId
    ? categories.find((c) => c.id === categoryId)
    : undefined;
  if (categoryId && !initial) {
    return <FormAlert>This category no longer exists.</FormAlert>;
  }

  return (
    <CategoryFormInner
      key={categoryId ?? "new"}
      initial={initial}
      defaultParentId={defaultParentId}
      categories={categories}
    />
  );
}

function CategoryFormInner({
  initial,
  defaultParentId,
  categories,
}: {
  initial?: AdminCategory;
  defaultParentId: string | null;
  categories: AdminCategory[];
}) {
  const router = useRouter();

  // Controlled throughout, so a failed save never wipes the edits.
  const [values, setValues] = React.useState(() => ({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    parentId:
      initial?.parentId ??
      (categories.some((c) => c.id === defaultParentId)
        ? defaultParentId
        : null),
    sortOrder: String(initial?.sortOrder ?? 0),
    isActive: initial?.isActive ?? true,
    showOnHome: initial?.showOnHome ?? false,
    homeSortOrder: String(initial?.homeSortOrder ?? 0),
    metaTitle: initial?.metaTitle ?? "",
    metaDescription: initial?.metaDescription ?? "",
    metaKeywords: initial?.metaKeywords ?? "",
  }));
  const [slots, setSlots] = React.useState(() => ({
    icon: emptySlot(initial?.icon ?? null),
    image: emptySlot(initial?.image ?? null),
    banner: emptySlot(initial?.banner ?? null),
  }));

  const set = <K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) => setValues((v) => ({ ...v, [key]: value }));
  const setSlot = (key: keyof typeof slots) => (slot: ImageSlot) =>
    setSlots((s) => ({ ...s, [key]: slot }));

  // Max tree depth is 3, so only roots and their direct children can be
  // parents. Editing also excludes the category itself and its subtree.
  const parentOptions = React.useMemo(() => {
    const depthOf = (c: AdminCategory): number => {
      let depth = 0;
      let cursor = c;
      while (cursor.parentId) {
        const parent = categories.find((p) => p.id === cursor.parentId);
        if (!parent) break;
        depth += 1;
        cursor = parent;
      }
      return depth;
    };
    const inSubtree = (c: AdminCategory): boolean => {
      let cursor: AdminCategory | undefined = c;
      while (cursor) {
        if (cursor.id === initial?.id) return true;
        cursor = categories.find((p) => p.id === cursor?.parentId);
      }
      return false;
    };
    return [
      { value: NO_PARENT, label: "None — top level" },
      ...categories
        .filter((c) => depthOf(c) < 2 && !inSubtree(c))
        .map((c) => ({
          value: c.id,
          label: c.parentId
            ? `${categories.find((p) => p.id === c.parentId)?.name} › ${c.name}`
            : c.name,
        })),
    ];
  }, [categories, initial?.id]);

  const [state, formAction, pending] = React.useActionState<
    FormState | undefined,
    FormData
  >(async () => {
    const parsed = categorySchema.safeParse(values);
    if (!parsed.success) {
      return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }
    const trimOrNull = (s: string) => {
      const t = s.trim();
      return t === "" ? null : t;
    };

    try {
      const payload: CategoryPayload = {
        name: parsed.data.name,
        description: trimOrNull(values.description),
        parentId: values.parentId,
        sortOrder: parsed.data.sortOrder,
        isActive: values.isActive,
        showOnHome: values.showOnHome,
        homeSortOrder: parsed.data.homeSortOrder,
        metaTitle: trimOrNull(values.metaTitle),
        metaDescription: trimOrNull(values.metaDescription),
        metaKeywords: trimOrNull(values.metaKeywords),
      };
      const slug = values.slug.trim();
      if (slug) payload.slug = slug;

      // Upload staged files first, then reference them; untouched slots are
      // omitted so the backend keeps its stored url + publicId pair.
      for (const key of ["icon", "image", "banner"] as const) {
        const slot = slots[key];
        if (!slotChanged(slot)) continue;
        if (slot.file) {
          const uploaded = await uploadImage(slot.file, "categories");
          payload[key] = uploaded.url;
          payload[`${key}PublicId`] = uploaded.publicId;
        } else {
          payload[key] = null;
          payload[`${key}PublicId`] = null;
        }
      }

      if (initial) {
        await updateCategory(initial.id, payload);
      } else {
        await createCategory({ ...payload, name: parsed.data.name });
      }
      router.push("/admin/categories");
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
              <label htmlFor="cat-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="cat-name"
                required
                className="h-10"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.name} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cat-slug" className="text-sm font-medium">
                Slug{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="cat-slug"
                className="h-10 font-mono text-sm"
                placeholder={slugify(values.name) || "auto-generated"}
                value={values.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to generate from the name.
              </p>
              <FieldError messages={state?.fieldErrors?.slug} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cat-description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="cat-description"
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.description} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" id="cat-parent-label">
                  Parent category
                </label>
                <Select
                  value={values.parentId ?? NO_PARENT}
                  items={parentOptions}
                  onValueChange={(value) =>
                    set("parentId", value === NO_PARENT ? null : value)
                  }
                >
                  <SelectTrigger
                    aria-labelledby="cat-parent-label"
                    className="h-10 w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {parentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError messages={state?.fieldErrors?.parentId} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cat-sort" className="text-sm font-medium">
                  Sort order
                </label>
                <Input
                  id="cat-sort"
                  type="number"
                  className="h-10"
                  value={values.sortOrder}
                  onChange={(e) => set("sortOrder", e.target.value)}
                />
                <FieldError messages={state?.fieldErrors?.sortOrder} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>JPG or PNG, up to 2 MB each.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ImagePicker
              id="cat-icon"
              label="Icon"
              hint="Small square shown in menus."
              slot={slots.icon}
              onChange={setSlot("icon")}
              previewClass="size-10 rounded-md object-cover"
            />
            <ImagePicker
              id="cat-image"
              label="Tile image"
              hint="Homepage “Shop by category” tile."
              slot={slots.image}
              onChange={setSlot("image")}
              previewClass="size-16 rounded-lg object-cover"
            />
            <ImagePicker
              id="cat-banner"
              label="Banner"
              hint="Wide header on the category page."
              slot={slots.banner}
              onChange={setSlot("banner")}
              previewClass="h-16 w-40 rounded-lg object-cover"
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
              <label htmlFor="cat-meta-title" className="text-sm font-medium">
                Meta title{" "}
                <span className="font-normal text-muted-foreground">
                  ({values.metaTitle.length}/160)
                </span>
              </label>
              <Input
                id="cat-meta-title"
                className="h-10"
                value={values.metaTitle}
                onChange={(e) => set("metaTitle", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.metaTitle} />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="cat-meta-description"
                className="text-sm font-medium"
              >
                Meta description{" "}
                <span className="font-normal text-muted-foreground">
                  ({values.metaDescription.length}/320)
                </span>
              </label>
              <Textarea
                id="cat-meta-description"
                className="min-h-16"
                value={values.metaDescription}
                onChange={(e) => set("metaDescription", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.metaDescription} />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="cat-meta-keywords"
                className="text-sm font-medium"
              >
                Meta keywords
              </label>
              <Input
                id="cat-meta-keywords"
                className="h-10"
                placeholder="saree, jamdani, deshi fashion"
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
              htmlFor="cat-active"
              className="flex cursor-pointer items-center justify-between gap-3"
            >
              <span className="text-sm">
                <span className="block font-medium">Active</span>
                <span className="text-muted-foreground">
                  Visible in the storefront
                </span>
              </span>
              <Switch
                id="cat-active"
                checked={values.isActive}
                onCheckedChange={(checked) => set("isActive", checked)}
              />
            </label>
            <label
              htmlFor="cat-home"
              className="flex cursor-pointer items-center justify-between gap-3"
            >
              <span className="text-sm">
                <span className="block font-medium">Show on homepage</span>
                <span className="text-muted-foreground">
                  “Shop by category” tile
                </span>
              </span>
              <Switch
                id="cat-home"
                checked={values.showOnHome}
                onCheckedChange={(checked) => set("showOnHome", checked)}
              />
            </label>
            {values.showOnHome && (
              <div className="space-y-1.5">
                <label htmlFor="cat-home-sort" className="text-sm font-medium">
                  Homepage position
                </label>
                <Input
                  id="cat-home-sort"
                  type="number"
                  className="h-10"
                  value={values.homeSortOrder}
                  onChange={(e) => set("homeSortOrder", e.target.value)}
                />
                <FieldError messages={state?.fieldErrors?.homeSortOrder} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="flex-1">
            {pending
              ? "Saving…"
              : initial
                ? "Save changes"
                : "Create category"}
          </Button>
          <Button
            type="button"
            variant="outline"
            render={<Link href="/admin/categories" />}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
