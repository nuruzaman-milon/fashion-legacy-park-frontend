"use client";

import * as React from "react";
import Image from "next/image";
import { PlusIcon, StarIcon, Trash2Icon } from "lucide-react";

import { FormAlert } from "@/components/auth/form-alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addProductImage,
  deleteProductImage,
  getProductImages,
  setPrimaryImage,
} from "@/lib/api/admin/products";
import { MAX_UPLOAD_BYTES, uploadImage } from "@/lib/api/admin/uploads";
import { ApiError } from "@/lib/api/client";
import type { AdminProductImage, AdminProductOption } from "@/types/admin";
import { cn } from "@/lib/utils";

const UNSCOPED = "__all__";

/**
 * Product photo gallery, live: add = upload to Cloudinary then attach; the
 * star drives the backend's one-primary rule; a colour scope can only be set
 * at add time (the API has no image PATCH), so it's picked before uploading.
 */
export function ImagesSection({
  productId,
  images,
  options,
  onImagesChange,
}: {
  productId: string;
  images: AdminProductImage[];
  options: AdminProductOption[];
  onImagesChange: (images: AdminProductImage[]) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [scope, setScope] = React.useState<string>(UNSCOPED);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const scopeOptions = React.useMemo(() => {
    const values = options.flatMap((option) =>
      option.values.map((v) => ({
        value: v.id,
        label: `${option.name}: ${v.value}`,
      })),
    );
    return [{ value: UNSCOPED, label: "All variants" }, ...values];
  }, [options]);

  const valueLabel = (optionValueId: string | null) => {
    if (!optionValueId) return null;
    for (const option of options) {
      const value = option.values.find((v) => v.id === optionValueId);
      if (value) return value.value;
    }
    return null;
  };

  async function resync() {
    onImagesChange(await getProductImages(productId));
  }

  async function add(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Images can be at most 2 MB");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const uploaded = await uploadImage(file, "products");
      const image = await addProductImage(productId, {
        url: uploaded.url,
        publicId: uploaded.publicId,
        alt: file.name.replace(/\.\w+$/, ""),
        ...(scope !== UNSCOPED && { optionValueId: scope }),
      });
      // The backend may have flipped primary (first image rule) — trust it.
      if (image.isPrimary) await resync();
      else onImagesChange([...images, image]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not add the photo. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function makePrimary(id: string) {
    setBusy(true);
    setError(null);
    try {
      await setPrimaryImage(id);
      onImagesChange(
        images.map((img) => ({ ...img, isPrimary: img.id === id })),
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not set the cover photo. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      await deleteProductImage(id);
      // Resync instead of filtering locally — deleting the primary makes the
      // backend promote another image, and the star should follow it.
      await resync();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not remove the photo. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos</CardTitle>
        <CardDescription>
          JPG or PNG up to 2 MB. Star one as the cover; scope a photo to a
          colour so the storefront swaps it when that colour is picked.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <FormAlert>{error}</FormAlert>}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => {
            const scopeName = valueLabel(image.optionValueId);
            return (
              <figure
                key={image.id}
                className="group relative overflow-hidden rounded-lg border border-border"
              >
                <Image
                  src={image.url}
                  alt={image.alt ?? ""}
                  width={200}
                  height={250}
                  className="aspect-4/5 w-full object-cover"
                />
                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={
                      image.isPrimary
                        ? "Cover photo"
                        : "Make this the cover photo"
                    }
                    aria-pressed={image.isPrimary}
                    onClick={() => void makePrimary(image.id)}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md bg-background/80 backdrop-blur-sm transition-colors",
                      image.isPrimary
                        ? "text-brand"
                        : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-brand focus-visible:opacity-100",
                    )}
                  >
                    <StarIcon
                      className={cn("size-4", image.isPrimary && "fill-brand")}
                    />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    aria-label="Remove photo"
                    onClick={() => void remove(image.id)}
                    className="flex size-7 items-center justify-center rounded-md bg-background/80 text-muted-foreground opacity-0 backdrop-blur-sm transition-colors group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
                {scopeName && (
                  <figcaption className="absolute inset-x-0 bottom-0 p-1.5">
                    <Badge className="bg-background/80 text-foreground backdrop-blur-sm">
                      {scopeName}
                    </Badge>
                  </figcaption>
                )}
              </figure>
            );
          })}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void add(file);
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-4/5 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-ring hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <PlusIcon className="size-5" />
            <span className="text-xs font-medium">
              {busy ? "Working…" : "Add photo"}
            </span>
          </button>
        </div>

        {scopeOptions.length > 1 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>New photos apply to</span>
            <Select
              value={scope}
              items={scopeOptions}
              onValueChange={(v) => setScope(v ?? UNSCOPED)}
            >
              <SelectTrigger
                aria-label="Colour scope for new photos"
                className="h-8 w-44"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scopeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
