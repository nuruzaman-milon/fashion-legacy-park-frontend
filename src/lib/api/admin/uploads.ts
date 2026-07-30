import { apiFetch } from "@/lib/api/client";

/**
 * Two-step image contract (docs/catalog.md): upload here first, then save
 * BOTH `url` and `publicId` on the entity — the backend deletes the previous
 * Cloudinary asset by publicId when a field is replaced.
 */

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
}

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

/** `folder` must match /^[a-z-]{1,30}$/ or the backend files it under "misc". */
export async function uploadImage(
  file: File,
  folder?: string,
): Promise<UploadedImage> {
  const form = new FormData();
  form.append("image", file);
  if (folder) form.append("folder", folder);
  return apiFetch<UploadedImage>("/uploads/image", {
    method: "POST",
    body: form,
  });
}
