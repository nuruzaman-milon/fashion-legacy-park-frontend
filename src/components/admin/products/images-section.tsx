"use client";

import * as React from "react";
import Image from "next/image";
import { PlusIcon, StarIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AdminProductImage, AdminProductOption } from "@/types/admin";
import { cn } from "@/lib/utils";

/**
 * Photo grid of the edit page. Adding picks a local file and previews it via
 * object URL; the live version uploads to POST /uploads/image first, then
 * saves { url, publicId } on the product. Star = primary (one per product,
 * like the backend's partial unique index).
 */
export function ImagesSection({
  images: initialImages,
  options,
}: {
  images: AdminProductImage[];
  options: AdminProductOption[];
}) {
  const [images, setImages] = React.useState(initialImages);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const valueLabel = (optionValueId: string | null) => {
    if (!optionValueId) return null;
    for (const option of options) {
      const value = option.values.find((v) => v.id === optionValueId);
      if (value) return value.value;
    }
    return null;
  };

  const makePrimary = (id: string) =>
    setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.id === id })));

  const remove = (id: string) =>
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      // First image auto-becomes primary, mirroring the backend rule.
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });

  const add = (file: File) =>
    setImages((prev) => [
      ...prev,
      {
        id: `local-${prev.length}-${file.name}`,
        url: URL.createObjectURL(file),
        publicId: null,
        alt: file.name.replace(/\.\w+$/, ""),
        optionValueId: null,
        sortOrder: prev.length,
        isPrimary: prev.length === 0,
      },
    ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos</CardTitle>
        <CardDescription>
          JPG or PNG up to 2 MB. Star one as the cover; tag a photo with a
          colour so the storefront swaps it when that colour is picked.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => {
            const scope = valueLabel(image.optionValueId);
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
                  unoptimized={image.url.startsWith("blob:")}
                  className="aspect-4/5 w-full object-cover"
                />
                <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-1.5">
                  <button
                    type="button"
                    aria-label={
                      image.isPrimary
                        ? "Cover photo"
                        : "Make this the cover photo"
                    }
                    aria-pressed={image.isPrimary}
                    onClick={() => makePrimary(image.id)}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md bg-background/80 backdrop-blur-sm transition-colors",
                      image.isPrimary
                        ? "text-brand"
                        : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-brand focus-visible:opacity-100",
                    )}
                  >
                    <StarIcon
                      className={cn(
                        "size-4",
                        image.isPrimary && "fill-brand",
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => remove(image.id)}
                    className="flex size-7 items-center justify-center rounded-md bg-background/80 text-muted-foreground opacity-0 backdrop-blur-sm transition-colors group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
                {scope && (
                  <figcaption className="absolute inset-x-0 bottom-0 p-1.5">
                    <Badge className="bg-background/80 text-foreground backdrop-blur-sm">
                      {scope}
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
              if (file) add(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-4/5 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            <PlusIcon className="size-5" />
            <span className="text-xs font-medium">Add photo</span>
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Design preview — new photos stay local until the upload API is wired.
        </p>
      </CardContent>
    </Card>
  );
}
