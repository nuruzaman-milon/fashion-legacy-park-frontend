"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlusIcon, Trash2Icon } from "lucide-react";
import * as z from "zod";

import {
  emptySlot,
  ImagePicker,
  slotChanged,
  slotShows,
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
  createBanner,
  getAdminBanner,
  updateBanner,
  type AdminBanner,
  type BannerPayload,
  type BannerSupportingImage,
} from "@/lib/api/admin/banners";
import { MAX_UPLOAD_BYTES, uploadImage } from "@/lib/api/admin/uploads";
import { ApiError } from "@/lib/api/client";

/** Mirrors banner.validation.ts. */
const bannerSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(160, "At most 160 characters"),
  eyebrow: z.string().trim().max(120, "At most 120 characters"),
  subtitle: z.string().trim().max(500, "At most 500 characters"),
  imageAlt: z.string().trim().max(255, "At most 255 characters"),
  buttonText: z.string().trim().max(60, "At most 60 characters"),
  buttonLink: z.string().trim().max(500, "At most 500 characters"),
  sortOrder: z.coerce.number().int("Whole numbers only"),
});

const MAX_SUPPORTING = 4;

/** A supporting-collage row: an existing upload, a staged file, or both. */
interface SupportSlot {
  src: string | null;
  publicId: string | null;
  alt: string;
  /** Optional click-through; empty = the tile falls back to the button link. */
  href: string;
  file: File | null;
  preview: string | null;
}

interface FormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
}

function SupportRow({
  index,
  slot,
  onChange,
  onRemove,
}: {
  index: number;
  slot: SupportSlot;
  onChange: (slot: SupportSlot) => void;
  onRemove: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const shown = slot.preview ?? slot.src;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={shown ? "Replace image" : "Pick an image"}
        onClick={() => inputRef.current?.click()}
        className="shrink-0"
      >
        {shown ? (
          <Image
            src={shown}
            alt=""
            width={64}
            height={80}
            unoptimized={shown.startsWith("blob:")}
            className="h-20 w-16 rounded-md object-cover"
          />
        ) : (
          <span className="flex h-20 w-16 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
            <PlusIcon className="size-4" />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (!file.type.startsWith("image/") || file.size > MAX_UPLOAD_BYTES)
            return;
          onChange({
            ...slot,
            file,
            preview: URL.createObjectURL(file),
          });
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Input
          aria-label={`Supporting image ${index + 1} alt text`}
          placeholder="Describe the photo (alt text)"
          className="h-9"
          value={slot.alt}
          onChange={(e) => onChange({ ...slot, alt: e.target.value })}
        />
        <Input
          aria-label={`Supporting image ${index + 1} link`}
          placeholder="Link, e.g. /products/red-gown (optional)"
          className="h-9 font-mono text-sm"
          value={slot.href}
          onChange={(e) => onChange({ ...slot, href: e.target.value })}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Remove supporting image ${index + 1}`}
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2Icon className="size-4" />
      </Button>
    </div>
  );
}

/** Create (`bannerId` absent) or edit a hero banner. */
export function BannerForm({ bannerId }: { bannerId?: string }) {
  const [initial, setInitial] = React.useState<AdminBanner | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const ready = !bannerId || initial !== null;

  React.useEffect(() => {
    if (!bannerId) return;
    let cancelled = false;
    getAdminBanner(bannerId)
      .then((banner) => {
        if (!cancelled) setInitial(banner);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError && err.status === 404
              ? "This banner no longer exists."
              : err instanceof ApiError
                ? err.message
                : "Could not load the banner. Please try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [bannerId]);

  if (loadError) return <FormAlert>{loadError}</FormAlert>;
  if (!ready) {
    return (
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_18rem]">
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return <BannerFormInner key={bannerId ?? "new"} initial={initial} />;
}

function BannerFormInner({ initial }: { initial: AdminBanner | null }) {
  const router = useRouter();

  // Controlled throughout — a failed save never wipes the edits.
  const [values, setValues] = React.useState(() => ({
    title: initial?.title ?? "",
    eyebrow: initial?.eyebrow ?? "",
    subtitle: initial?.subtitle ?? "",
    imageAlt: initial?.imageAlt ?? "",
    buttonText: initial?.buttonText ?? "",
    buttonLink: initial?.buttonLink ?? "",
    sortOrder: String(initial?.sortOrder ?? 0),
    isActive: initial?.isActive ?? true,
  }));
  const [desktop, setDesktop] = React.useState(() =>
    emptySlot(initial?.desktopImageUrl ?? null),
  );
  const [mobile, setMobile] = React.useState(() =>
    emptySlot(initial?.mobileImageUrl ?? null),
  );
  const [supporting, setSupporting] = React.useState<SupportSlot[]>(() =>
    (initial?.supportingImages ?? []).map((img) => ({
      src: img.src,
      publicId: img.publicId ?? null,
      alt: img.alt ?? "",
      href: img.href ?? "",
      file: null,
      preview: null,
    })),
  );
  const [supportingDirty, setSupportingDirty] = React.useState(false);

  const set = <K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  const patchSupporting = (
    update: (slots: SupportSlot[]) => SupportSlot[],
  ) => {
    setSupporting(update);
    setSupportingDirty(true);
  };

  const [state, formAction, pending] = React.useActionState<
    FormState | undefined,
    FormData
  >(async () => {
    const parsed = bannerSchema.safeParse(values);
    if (!parsed.success) {
      return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }
    if (!slotShows(desktop)) {
      return { formError: "A desktop image is required — the hero can't render without one." };
    }
    const trimOrNull = (s: string) => {
      const t = s.trim();
      return t === "" ? null : t;
    };

    try {
      const payload: BannerPayload = {
        title: parsed.data.title,
        eyebrow: trimOrNull(values.eyebrow),
        subtitle: trimOrNull(values.subtitle),
        imageAlt: trimOrNull(values.imageAlt),
        buttonText: trimOrNull(values.buttonText),
        buttonLink: trimOrNull(values.buttonLink),
        sortOrder: parsed.data.sortOrder,
        isActive: values.isActive,
      };

      if (slotChanged(desktop) && desktop.file) {
        const uploaded = await uploadImage(desktop.file, "banners");
        payload.desktopImageUrl = uploaded.url;
        payload.desktopImagePublicId = uploaded.publicId;
      }
      if (slotChanged(mobile)) {
        if (mobile.file) {
          const uploaded = await uploadImage(mobile.file, "banners");
          payload.mobileImageUrl = uploaded.url;
          payload.mobileImagePublicId = uploaded.publicId;
        } else {
          payload.mobileImageUrl = null;
          payload.mobileImagePublicId = null;
        }
      }

      if (supportingDirty) {
        const images: BannerSupportingImage[] = [];
        for (const slot of supporting) {
          let src = slot.src;
          let publicId = slot.publicId;
          if (slot.file) {
            const uploaded = await uploadImage(slot.file, "banners");
            src = uploaded.url;
            publicId = uploaded.publicId;
          }
          if (!src) continue; // an empty row that never got an image
          images.push({
            src,
            ...(slot.alt.trim() && { alt: slot.alt.trim() }),
            ...(slot.href.trim() && { href: slot.href.trim() }),
            ...(publicId && { publicId }),
          });
        }
        payload.supportingImages = images;
      }

      if (initial) {
        await updateBanner(initial.id, payload);
      } else {
        await createBanner({
          ...payload,
          title: parsed.data.title,
          desktopImageUrl: payload.desktopImageUrl!,
        });
      }
      router.push("/admin/banners");
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
            <CardTitle>Content</CardTitle>
            <CardDescription>
              What the hero says — eyebrow, headline, supporting line and the
              call to action.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="ban-eyebrow" className="text-sm font-medium">
                Eyebrow{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="ban-eyebrow"
                className="h-10"
                placeholder="Eid Collection · 2026"
                value={values.eyebrow}
                onChange={(e) => set("eyebrow", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.eyebrow} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ban-title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="ban-title"
                required
                className="h-10"
                placeholder="This Eid, wear your legacy"
                value={values.title}
                onChange={(e) => set("title", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.title} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="ban-subtitle" className="text-sm font-medium">
                Subtitle{" "}
                <span className="font-normal text-muted-foreground">
                  ({values.subtitle.length}/500)
                </span>
              </label>
              <Textarea
                id="ban-subtitle"
                className="min-h-16"
                value={values.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.subtitle} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="ban-btn-text" className="text-sm font-medium">
                  Button label
                </label>
                <Input
                  id="ban-btn-text"
                  className="h-10"
                  placeholder="Shop the collection"
                  value={values.buttonText}
                  onChange={(e) => set("buttonText", e.target.value)}
                />
                <FieldError messages={state?.fieldErrors?.buttonText} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="ban-btn-link" className="text-sm font-medium">
                  Button link
                </label>
                <Input
                  id="ban-btn-link"
                  className="h-10 font-mono text-sm"
                  placeholder="/products?sale=1"
                  value={values.buttonLink}
                  onChange={(e) => set("buttonLink", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A store path (/products…) or a full URL.
                </p>
                <FieldError messages={state?.fieldErrors?.buttonLink} />
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
              id="ban-desktop"
              label="Desktop image"
              hint="The main hero artwork — wide crop. Clicking it opens the button link."
              slot={desktop}
              onChange={setDesktop}
              previewClass="h-20 w-40 rounded-lg object-cover"
            />
            <ImagePicker
              id="ban-mobile"
              label={
                <>
                  Mobile image{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </>
              }
              hint="Taller crop for phones; desktop image is used if empty."
              slot={mobile}
              onChange={setMobile}
              previewClass="h-24 w-16 rounded-lg object-cover"
            />
            <div className="space-y-1.5">
              <label htmlFor="ban-alt" className="text-sm font-medium">
                Image alt text
              </label>
              <Input
                id="ban-alt"
                className="h-10"
                placeholder="Model in an embroidered panjabi"
                value={values.imageAlt}
                onChange={(e) => set("imageAlt", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.imageAlt} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Supporting images{" "}
                <span className="font-normal text-muted-foreground">
                  (collage, up to {MAX_SUPPORTING})
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Each tile can link to its own product or category; without a
                link it opens the button link.
              </p>
              <div className="flex flex-col gap-3">
                {supporting.map((slot, index) => (
                  <SupportRow
                    key={index}
                    index={index}
                    slot={slot}
                    onChange={(next) =>
                      patchSupporting((slots) =>
                        slots.map((s, i) => (i === index ? next : s)),
                      )
                    }
                    onRemove={() =>
                      patchSupporting((slots) =>
                        slots.filter((_, i) => i !== index),
                      )
                    }
                  />
                ))}
                {supporting.length < MAX_SUPPORTING && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={() =>
                      patchSupporting((slots) => [
                        ...slots,
                        {
                          src: null,
                          publicId: null,
                          alt: "",
                          href: "",
                          file: null,
                          preview: null,
                        },
                      ])
                    }
                  >
                    <PlusIcon className="size-3.5" />
                    Add supporting image
                  </Button>
                )}
              </div>
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
              htmlFor="ban-active"
              className="flex cursor-pointer items-center justify-between gap-3"
            >
              <span className="text-sm">
                <span className="block font-medium">Active</span>
                <span className="text-muted-foreground">
                  Eligible for the homepage hero
                </span>
              </span>
              <Switch
                id="ban-active"
                checked={values.isActive}
                onCheckedChange={(checked) => set("isActive", checked)}
              />
            </label>
            <div className="space-y-1.5">
              <label htmlFor="ban-sort" className="text-sm font-medium">
                Position
              </label>
              <Input
                id="ban-sort"
                type="number"
                className="h-10"
                value={values.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The homepage shows the first active banner.
              </p>
              <FieldError messages={state?.fieldErrors?.sortOrder} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? "Saving…" : initial ? "Save changes" : "Create banner"}
          </Button>
          <Button
            type="button"
            variant="outline"
            render={<Link href="/admin/banners" />}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
