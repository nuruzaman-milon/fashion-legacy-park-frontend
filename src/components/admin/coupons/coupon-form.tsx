"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";
import * as z from "zod";

import { CategoryCascade } from "@/components/admin/categories/category-cascade";
import { ProductSearch } from "@/components/admin/flash-sales/product-search";
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
  categoryPathLabel,
  getAdminCategories,
} from "@/lib/api/admin/categories";
import {
  createCoupon,
  updateCoupon,
  getAdminCoupon,
  type AdminCouponDetail,
  type CouponDiscountType,
  type CouponPayload,
} from "@/lib/api/admin/coupons";
import { ApiError } from "@/lib/api/client";
import type { AdminCategory } from "@/types/admin";

const TYPE_ITEMS = [
  { value: "PERCENTAGE", label: "Percentage (%)" },
  { value: "FIXED", label: "Fixed amount (৳)" },
  { value: "FREE_SHIPPING", label: "Free shipping" },
] as const;

/** Mirrors coupon.validation.ts. */
const couponSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "At least 2 characters")
      .max(160, "At most 160 characters"),
    code: z
      .string()
      .trim()
      .min(3, "At least 3 characters")
      .max(40, "At most 40 characters")
      .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, dashes and underscores only"),
    description: z.string().trim().max(1000, "At most 1000 characters"),
    discountType: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
    discountValue: z.string(),
    maximumDiscount: z.string(),
    minimumOrderAmount: z.string(),
    totalUsageLimit: z.string(),
    perUserLimit: z.string(),
    startsAt: z.string(),
    expiresAt: z.string(),
  })
  .superRefine((v, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", message, path: [path] });

    if (v.discountType !== "FREE_SHIPPING") {
      const value = Number(v.discountValue);
      if (v.discountValue.trim() === "" || Number.isNaN(value) || value <= 0) {
        issue("discountValue", "Enter an amount above zero");
      } else if (v.discountType === "PERCENTAGE" && value > 100) {
        issue("discountValue", "A percentage cannot exceed 100");
      }
    }

    const positiveOrEmpty = (raw: string, path: string, int = false) => {
      if (raw.trim() === "") return;
      const n = Number(raw);
      if (Number.isNaN(n) || n <= 0 || (int && !Number.isInteger(n))) {
        issue(
          path,
          int ? "Enter a whole number above zero" : "Enter an amount above zero",
        );
      }
    };
    positiveOrEmpty(v.maximumDiscount, "maximumDiscount");
    positiveOrEmpty(v.minimumOrderAmount, "minimumOrderAmount");
    positiveOrEmpty(v.totalUsageLimit, "totalUsageLimit", true);
    if (v.perUserLimit.trim() === "") {
      issue("perUserLimit", "Required — 1 is the usual value");
    } else {
      positiveOrEmpty(v.perUserLimit, "perUserLimit", true);
    }

    if (
      v.startsAt &&
      v.expiresAt &&
      new Date(v.expiresAt) <= new Date(v.startsAt)
    ) {
      issue("expiresAt", "Must expire after it starts");
    }
  });

interface FormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  saved?: boolean;
}

/** ISO → the local-time "YYYY-MM-DDTHH:mm" a datetime-local input wants. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** Create (`couponId` absent) or edit a coupon. */
export function CouponForm({ couponId }: { couponId?: string }) {
  const [initial, setInitial] = React.useState<AdminCouponDetail | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<AdminCategory[] | null>(
    null,
  );
  const [categoriesError, setCategoriesError] = React.useState(false);
  const ready = !couponId || initial !== null;

  React.useEffect(() => {
    let cancelled = false;
    getAdminCategories()
      .then((all) => {
        if (!cancelled) setCategories(all);
      })
      .catch(() => {
        if (!cancelled) setCategoriesError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!couponId) return;
    let cancelled = false;
    getAdminCoupon(couponId)
      .then((coupon) => {
        if (!cancelled) setInitial(coupon);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError && err.status === 404
              ? "This coupon no longer exists."
              : err instanceof ApiError
                ? err.message
                : "Could not load the coupon. Please try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [couponId]);

  if (loadError) return <FormAlert>{loadError}</FormAlert>;
  if (!ready) {
    return (
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_18rem]">
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <CouponFormInner
      key={couponId ?? "new"}
      initial={initial}
      categories={categories}
      categoriesError={categoriesError}
    />
  );
}

function CouponFormInner({
  initial,
  categories,
  categoriesError,
}: {
  initial: AdminCouponDetail | null;
  categories: AdminCategory[] | null;
  categoriesError: boolean;
}) {
  const router = useRouter();

  // Controlled throughout — a failed save never wipes the edits.
  const [values, setValues] = React.useState(() => ({
    name: initial?.name ?? "",
    code: initial?.code ?? "",
    description: initial?.description ?? "",
    discountType: (initial?.discountType ?? "PERCENTAGE") as CouponDiscountType,
    discountValue: initial ? String(Number(initial.discountValue)) : "",
    maximumDiscount: initial?.maximumDiscount
      ? String(Number(initial.maximumDiscount))
      : "",
    minimumOrderAmount: initial?.minimumOrderAmount
      ? String(Number(initial.minimumOrderAmount))
      : "",
    totalUsageLimit:
      initial?.totalUsageLimit !== null && initial !== null
        ? String(initial.totalUsageLimit)
        : "",
    perUserLimit: String(initial?.perUserLimit ?? 1),
    startsAt: initial?.startsAt ? toLocalInput(initial.startsAt) : "",
    expiresAt: initial?.expiresAt ? toLocalInput(initial.expiresAt) : "",
    isActive: initial?.isActive ?? true,
    applyWithFlashSale: initial?.applyWithFlashSale ?? false,
  }));
  const [categoryIds, setCategoryIds] = React.useState<string[]>(
    () => initial?.categories.map((c) => c.categoryId) ?? [],
  );
  const [products, setProducts] = React.useState<{ id: string; name: string }[]>(
    () =>
      initial?.products.map((p) => ({
        id: p.productId,
        name: p.product.name,
      })) ?? [],
  );
  // The cascade's pending pick — added to the list via the button.
  const [pickCategory, setPickCategory] = React.useState<string | null>(null);

  // Detail rows carry names, so chips render before the full tree loads.
  const initialCategoryNames = React.useMemo(
    () =>
      new Map(
        (initial?.categories ?? []).map((c) => [c.categoryId, c.category.name]),
      ),
    [initial],
  );

  const categoryLabel = (id: string): string => {
    const category = categories?.find((c) => c.id === id);
    if (category && categories) return categoryPathLabel(category, categories);
    return initialCategoryNames.get(id) ?? id;
  };

  const set = <K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  const [state, formAction, pending] = React.useActionState<
    FormState | undefined,
    FormData
  >(async () => {
    const parsed = couponSchema.safeParse(values);
    if (!parsed.success) {
      return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }
    if (
      initial &&
      values.totalUsageLimit.trim() !== "" &&
      Number(values.totalUsageLimit) < initial.usedCount
    ) {
      return {
        fieldErrors: {
          totalUsageLimit: [
            `Already used ${initial.usedCount} times — the limit cannot go below that`,
          ],
        },
      };
    }

    const numOrNull = (raw: string) =>
      raw.trim() === "" ? null : Number(raw);
    const type = values.discountType;

    try {
      const payload: CouponPayload = {
        name: parsed.data.name,
        code: parsed.data.code.toUpperCase(),
        description:
          parsed.data.description === "" ? null : parsed.data.description,
        discountType: type,
        discountValue:
          type === "FREE_SHIPPING" ? 0 : Number(values.discountValue),
        maximumDiscount:
          type === "PERCENTAGE" ? numOrNull(values.maximumDiscount) : null,
        minimumOrderAmount: numOrNull(values.minimumOrderAmount),
        totalUsageLimit: numOrNull(values.totalUsageLimit),
        perUserLimit: Number(values.perUserLimit),
        startsAt: values.startsAt
          ? new Date(values.startsAt).toISOString()
          : null,
        expiresAt: values.expiresAt
          ? new Date(values.expiresAt).toISOString()
          : null,
        isActive: values.isActive,
        applyWithFlashSale: values.applyWithFlashSale,
        // The form owns the complete sets, so always send the full replace.
        categoryIds,
        productIds: products.map((p) => p.id),
      };

      if (initial) {
        await updateCoupon(initial.id, payload);
        return { saved: true };
      }

      await createCoupon({
        ...payload,
        name: parsed.data.name,
        code: parsed.data.code.toUpperCase(),
        discountType: type,
      });
      router.push("/admin/coupons");
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
            <CardTitle>Coupon</CardTitle>
            <CardDescription>
              The code customers type at checkout, and how it appears in the
              admin list.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="cp-name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="cp-name"
                  required
                  className="h-10"
                  placeholder="Eid launch offer"
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                />
                <FieldError messages={state?.fieldErrors?.name} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="cp-code" className="text-sm font-medium">
                  Code
                </label>
                <Input
                  id="cp-code"
                  required
                  className="h-10 font-mono uppercase"
                  placeholder="EID25"
                  value={values.code}
                  onChange={(e) => set("code", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Letters, numbers, dashes — stored uppercase, must be unique.
                </p>
                <FieldError messages={state?.fieldErrors?.code} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cp-description" className="text-sm font-medium">
                Description{" "}
                <span className="font-normal text-muted-foreground">
                  ({values.description.length}/1000, optional)
                </span>
              </label>
              <Textarea
                id="cp-description"
                className="min-h-16"
                placeholder="25% off everything for the Eid week."
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.description} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Discount</CardTitle>
            <CardDescription>
              What the coupon takes off the order at checkout.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label htmlFor="cp-type" className="text-sm font-medium">
                  Type
                </label>
                <Select
                  value={values.discountType}
                  items={TYPE_ITEMS.map((t) => ({
                    value: t.value,
                    label: t.label,
                  }))}
                  onValueChange={(v) => {
                    if (v) set("discountType", v as CouponDiscountType);
                  }}
                >
                  <SelectTrigger
                    id="cp-type"
                    aria-label="Discount type"
                    className="h-10 w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_ITEMS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {values.discountType !== "FREE_SHIPPING" && (
                <div className="space-y-1.5">
                  <label htmlFor="cp-value" className="text-sm font-medium">
                    {values.discountType === "PERCENTAGE"
                      ? "Percent off"
                      : "Amount off (৳)"}
                  </label>
                  <Input
                    id="cp-value"
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    className="h-10"
                    placeholder={
                      values.discountType === "PERCENTAGE" ? "25" : "200"
                    }
                    value={values.discountValue}
                    onChange={(e) => set("discountValue", e.target.value)}
                  />
                  <FieldError messages={state?.fieldErrors?.discountValue} />
                </div>
              )}
              {values.discountType === "PERCENTAGE" && (
                <div className="space-y-1.5">
                  <label htmlFor="cp-cap" className="text-sm font-medium">
                    Cap (৳){" "}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <Input
                    id="cp-cap"
                    type="number"
                    min={0}
                    step="0.01"
                    className="h-10"
                    placeholder="500"
                    value={values.maximumDiscount}
                    onChange={(e) => set("maximumDiscount", e.target.value)}
                  />
                  <FieldError messages={state?.fieldErrors?.maximumDiscount} />
                </div>
              )}
            </div>
            {values.discountType === "FREE_SHIPPING" && (
              <p className="text-sm text-muted-foreground">
                The shipping charge becomes ৳0 at checkout — no amount needed.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="cp-min-order" className="text-sm font-medium">
                  Minimum order (৳){" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <Input
                  id="cp-min-order"
                  type="number"
                  min={0}
                  step="0.01"
                  className="h-10"
                  placeholder="1000"
                  value={values.minimumOrderAmount}
                  onChange={(e) => set("minimumOrderAmount", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The coupon only applies once the order reaches this subtotal.
                </p>
                <FieldError messages={state?.fieldErrors?.minimumOrderAmount} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scope</CardTitle>
            <CardDescription>
              Leave both empty to apply the coupon store-wide — attach
              categories or products to narrow it to just those.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">Categories</p>
              {categoriesError ? (
                <p className="text-xs text-destructive">
                  Could not load categories — reload the page to scope by
                  category.
                </p>
              ) : categories === null ? (
                <p className="text-sm text-muted-foreground">
                  Loading categories…
                </p>
              ) : (
                <>
                  <CategoryCascade
                    categories={categories}
                    value={pickCategory}
                    onChange={setPickCategory}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      !pickCategory || categoryIds.includes(pickCategory)
                    }
                    onClick={() => {
                      if (!pickCategory) return;
                      setCategoryIds((ids) => [...ids, pickCategory]);
                      setPickCategory(null);
                    }}
                  >
                    Add category
                  </Button>
                </>
              )}
              {categoryIds.length > 0 && (
                <ul className="flex flex-wrap gap-1.5 pt-1">
                  {categoryIds.map((id) => (
                    <li
                      key={id}
                      className="flex items-center gap-1 rounded-4xl border border-border bg-muted/50 py-1 pr-1 pl-2.5 text-xs"
                    >
                      {categoryLabel(id)}
                      <button
                        type="button"
                        aria-label={`Remove ${categoryLabel(id)}`}
                        onClick={() =>
                          setCategoryIds((ids) => ids.filter((x) => x !== id))
                        }
                        className="rounded-full p-0.5 transition-colors hover:bg-accent"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Products</p>
              <ProductSearch
                onPick={(product) =>
                  setProducts((prev) =>
                    prev.some((p) => p.id === product.id)
                      ? prev
                      : [...prev, { id: product.id, name: product.name }],
                  )
                }
              />
              {products.length > 0 && (
                <ul className="flex flex-wrap gap-1.5 pt-1">
                  {products.map((product) => (
                    <li
                      key={product.id}
                      className="flex items-center gap-1 rounded-4xl border border-border bg-muted/50 py-1 pr-1 pl-2.5 text-xs"
                    >
                      {product.name}
                      <button
                        type="button"
                        aria-label={`Remove ${product.name}`}
                        onClick={() =>
                          setProducts((prev) =>
                            prev.filter((p) => p.id !== product.id),
                          )
                        }
                        className="rounded-full p-0.5 transition-colors hover:bg-accent"
                      >
                        <XIcon className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-20">
        <Card>
          <CardHeader>
            <CardTitle>Window</CardTitle>
            <CardDescription>
              Blank boundaries are open-ended.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="cp-starts" className="text-sm font-medium">
                Starts{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="cp-starts"
                type="datetime-local"
                className="h-10"
                value={values.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.startsAt} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cp-expires" className="text-sm font-medium">
                Expires{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="cp-expires"
                type="datetime-local"
                className="h-10"
                value={values.expiresAt}
                onChange={(e) => set("expiresAt", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.expiresAt} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limits</CardTitle>
            {initial && (
              <CardDescription>
                Used {initial.usedCount}{" "}
                {initial.usedCount === 1 ? "time" : "times"} so far.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="cp-total-limit" className="text-sm font-medium">
                Total uses{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="cp-total-limit"
                type="number"
                min={initial?.usedCount || 1}
                step={1}
                className="h-10"
                placeholder="Unlimited"
                value={values.totalUsageLimit}
                onChange={(e) => set("totalUsageLimit", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.totalUsageLimit} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="cp-user-limit" className="text-sm font-medium">
                Uses per customer
              </label>
              <Input
                id="cp-user-limit"
                type="number"
                min={1}
                step={1}
                required
                className="h-10"
                value={values.perUserLimit}
                onChange={(e) => set("perUserLimit", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.perUserLimit} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              htmlFor="cp-active"
              className="flex cursor-pointer items-center justify-between gap-3"
            >
              <span className="text-sm">
                <span className="block font-medium">Active</span>
                <span className="text-muted-foreground">
                  Redeemable inside its window
                </span>
              </span>
              <Switch
                id="cp-active"
                checked={values.isActive}
                onCheckedChange={(checked) => set("isActive", checked)}
              />
            </label>
            <label
              htmlFor="cp-flash"
              className="flex cursor-pointer items-center justify-between gap-3"
            >
              <span className="text-sm">
                <span className="block font-medium">Stack with flash sale</span>
                <span className="text-muted-foreground">
                  Allowed on already flash-priced items
                </span>
              </span>
              <Switch
                id="cp-flash"
                checked={values.applyWithFlashSale}
                onCheckedChange={(checked) => set("applyWithFlashSale", checked)}
              />
            </label>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? "Saving…" : initial ? "Save changes" : "Create coupon"}
          </Button>
          {!initial && (
            <Button
              type="button"
              variant="outline"
              render={<Link href="/admin/coupons" />}
            >
              Cancel
            </Button>
          )}
        </div>
        {state?.saved && !pending && (
          <p className="text-sm text-muted-foreground">Changes saved.</p>
        )}
      </div>
    </form>
  );
}
