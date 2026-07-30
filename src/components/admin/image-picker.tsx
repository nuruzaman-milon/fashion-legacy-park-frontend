"use client";

import * as React from "react";
import Image from "next/image";
import { Trash2Icon, UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MAX_UPLOAD_BYTES } from "@/lib/api/admin/uploads";

/**
 * One image field of an admin form. `current` is the stored URL; picking a
 * file stages it (the form uploads on submit), `removed` clears the field.
 * `slotChanged` decides whether the PATCH mentions the field at all —
 * omitting an untouched slot preserves the stored url + publicId pair.
 */
export interface ImageSlot {
  current: string | null;
  file: File | null;
  preview: string | null;
  removed: boolean;
  error: string | null;
}

export const emptySlot = (current: string | null): ImageSlot => ({
  current,
  file: null,
  preview: null,
  removed: false,
  error: null,
});

export const slotChanged = (slot: ImageSlot) =>
  slot.file !== null || slot.removed;

export const slotShows = (slot: ImageSlot) =>
  slot.preview ?? (slot.removed ? null : slot.current);

export function ImagePicker({
  id,
  label,
  hint,
  slot,
  onChange,
  previewClass,
}: {
  id: string;
  label: React.ReactNode;
  hint: string;
  slot: ImageSlot;
  onChange: (slot: ImageSlot) => void;
  previewClass: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const shown = slotShows(slot);

  function pick(file: File) {
    if (!file.type.startsWith("image/")) {
      onChange({ ...slot, error: "Please choose an image file" });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      onChange({ ...slot, error: "Images can be at most 2 MB" });
      return;
    }
    onChange({
      ...slot,
      file,
      preview: URL.createObjectURL(file),
      removed: false,
      error: null,
    });
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-3">
        {shown ? (
          <Image
            src={shown}
            alt=""
            width={160}
            height={160}
            unoptimized={shown.startsWith("blob:")}
            className={previewClass}
          />
        ) : (
          <div
            className={`${previewClass} flex items-center justify-center bg-muted text-xs text-muted-foreground`}
          >
            None
          </div>
        )}
        <div className="flex flex-col items-start gap-1.5">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) pick(file);
            }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <UploadIcon className="size-3.5" />
              {shown ? "Replace" : "Upload"}
            </Button>
            {shown && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange({
                    ...slot,
                    file: null,
                    preview: null,
                    removed: slot.current !== null,
                    error: null,
                  })
                }
              >
                <Trash2Icon className="size-3.5" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
          {slot.error && (
            <p className="text-xs text-destructive">{slot.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
