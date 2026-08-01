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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  createFlashSale,
  updateFlashSale,
  type AdminFlashSale,
  type FlashSalePayload,
} from "@/lib/api/admin/flash-sales";
import { uploadImage } from "@/lib/api/admin/uploads";
import { ApiError } from "@/lib/api/client";

/** Mirrors flash-sale.validation.ts. */
const saleSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "At least 2 characters")
      .max(160, "At most 160 characters"),
    description: z.string().trim().max(1000, "At most 1000 characters"),
    startsAt: z.string().min(1, "Pick a start time"),
    endsAt: z.string().min(1, "Pick an end time"),
  })
  .refine(
    (v) => !v.startsAt || !v.endsAt || new Date(v.endsAt) > new Date(v.startsAt),
    { message: "Must end after it starts", path: ["endsAt"] },
  );

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

/**
 * Campaign details — create (`initial` absent, redirects to the edit page so
 * rules and items can be attached) or edit (PATCH in place, `onSaved` gets
 * the updated sale).
 */
export function FlashSaleForm({
  initial,
  onSaved,
}: {
  initial?: AdminFlashSale | null;
  onSaved?: (sale: AdminFlashSale) => void;
}) {
  const router = useRouter();

  // Controlled throughout — a failed save never wipes the edits.
  const [values, setValues] = React.useState(() => ({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    startsAt: initial ? toLocalInput(initial.startsAt) : "",
    endsAt: initial ? toLocalInput(initial.endsAt) : "",
    isActive: initial?.isActive ?? true,
  }));
  const [banner, setBanner] = React.useState(() =>
    emptySlot(initial?.banner ?? null),
  );

  const set = <K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  const [state, formAction, pending] = React.useActionState<
    FormState | undefined,
    FormData
  >(async () => {
    const parsed = saleSchema.safeParse(values);
    if (!parsed.success) {
      return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }

    try {
      const startsAt = new Date(values.startsAt).toISOString();
      const endsAt = new Date(values.endsAt).toISOString();
      const payload: FlashSalePayload = {
        title: parsed.data.title,
        description:
          parsed.data.description === "" ? null : parsed.data.description,
        startsAt,
        endsAt,
        isActive: values.isActive,
      };

      if (slotChanged(banner)) {
        if (banner.file) {
          const uploaded = await uploadImage(banner.file, "flash-sales");
          payload.banner = uploaded.url;
        } else {
          payload.banner = null;
        }
      }

      if (initial) {
        const updated = await updateFlashSale(initial.id, payload);
        onSaved?.(updated);
        return { saved: true };
      }

      const created = await createFlashSale({
        ...payload,
        title: parsed.data.title,
        startsAt,
        endsAt,
      });
      router.push(`/admin/flash-sales/${created.id}/edit`);
      return undefined;
    } catch (error) {
      if (error instanceof ApiError) {
        return { formError: error.message, fieldErrors: error.fieldErrors };
      }
      return { formError: "Something went wrong. Please try again." };
    }
  }, undefined);

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>Campaign</CardTitle>
          <CardDescription>
            {initial
              ? "Title, window and visibility. Edits to a live sale apply immediately."
              : "Name the sale and set its window — rules and items are added on the next screen."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state?.formError && <FormAlert>{state.formError}</FormAlert>}

          <div className="space-y-1.5">
            <label htmlFor="fs-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="fs-title"
              required
              className="h-10"
              placeholder="Eid Flash Sale"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
            />
            <FieldError messages={state?.fieldErrors?.title} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="fs-description" className="text-sm font-medium">
              Description{" "}
              <span className="font-normal text-muted-foreground">
                ({values.description.length}/1000, optional)
              </span>
            </label>
            <Textarea
              id="fs-description"
              className="min-h-16"
              placeholder="Up to 40% off across the Eid collection."
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
            />
            <FieldError messages={state?.fieldErrors?.description} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="fs-starts" className="text-sm font-medium">
                Starts
              </label>
              <Input
                id="fs-starts"
                type="datetime-local"
                required
                className="h-10"
                value={values.startsAt}
                onChange={(e) => set("startsAt", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.startsAt} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="fs-ends" className="text-sm font-medium">
                Ends
              </label>
              <Input
                id="fs-ends"
                type="datetime-local"
                required
                className="h-10"
                value={values.endsAt}
                onChange={(e) => set("endsAt", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.endsAt} />
            </div>
          </div>

          <ImagePicker
            id="fs-banner"
            label={
              <>
                Banner{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </>
            }
            hint="Campaign artwork for the storefront section. JPG or PNG, up to 2 MB."
            slot={banner}
            onChange={setBanner}
            previewClass="h-20 w-40 rounded-lg object-cover"
          />

          <label
            htmlFor="fs-active"
            className="flex cursor-pointer items-center justify-between gap-3"
          >
            <span className="text-sm">
              <span className="block font-medium">Active</span>
              <span className="text-muted-foreground">
                Eligible to go live during its window
              </span>
            </span>
            <Switch
              id="fs-active"
              checked={values.isActive}
              onCheckedChange={(checked) => set("isActive", checked)}
            />
          </label>

          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving…"
                : initial
                  ? "Save changes"
                  : "Create flash sale"}
            </Button>
            {!initial && (
              <Button
                type="button"
                variant="outline"
                render={<Link href="/admin/flash-sales" />}
              >
                Cancel
              </Button>
            )}
            {state?.saved && !pending && (
              <span className="text-sm text-muted-foreground">
                Changes saved.
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
