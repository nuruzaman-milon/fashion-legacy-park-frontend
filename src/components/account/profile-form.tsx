"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2Icon, UploadIcon } from "lucide-react";
import * as z from "zod";

import { useAuth } from "@/components/auth/auth-provider";
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
import { removeAvatar, updateProfile, uploadAvatar } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { normalizePhone } from "@/lib/auth/validation";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(100, "At most 100 characters"),
  phone: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile, e.g. 01712345678")
    .optional(),
});

interface ProfileState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  saved?: boolean;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileForm() {
  const { user, setUser } = useAuth();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [avatarBusy, setAvatarBusy] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState<string | null>(null);

  // Controlled so a failed save never wipes the edits — React resets
  // uncontrolled fields when a form action completes.
  const [values, setValues] = React.useState(() => ({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
  }));
  const update =
    (name: "name" | "phone") => (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [name]: e.target.value }));

  const [state, formAction, pending] = React.useActionState<
    ProfileState | undefined,
    FormData
  >(async () => {
    const parsed = profileSchema.safeParse({
      name: values.name.trim(),
      phone: values.phone.trim()
        ? normalizePhone(values.phone.trim())
        : undefined,
    });
    if (!parsed.success) {
      return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }

    try {
      const updated = await updateProfile({
        name: parsed.data.name,
        phone: parsed.data.phone,
      });
      setUser(updated);
      return { saved: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          formError: error.message,
          fieldErrors: error.fieldErrors,
        };
      }
      return { formError: "Something went wrong. Please try again." };
    }
  }, undefined);

  if (!user) return null;

  async function onAvatarPicked(file: File) {
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Images can be at most 2 MB");
      return;
    }
    setAvatarError(null);
    setAvatarBusy(true);
    try {
      setUser(await uploadAvatar(file));
    } catch (error) {
      setAvatarError(
        error instanceof ApiError
          ? error.message
          : "Upload failed. Please try again.",
      );
    } finally {
      setAvatarBusy(false);
    }
  }

  async function onAvatarRemove() {
    setAvatarError(null);
    setAvatarBusy(true);
    try {
      setUser(await removeAvatar());
    } catch (error) {
      setAvatarError(
        error instanceof ApiError
          ? error.message
          : "Could not remove the photo. Please try again.",
      );
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile photo</CardTitle>
          <CardDescription>
            Shown on your account. JPG or PNG, up to 2 MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt=""
                width={64}
                height={64}
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                {initialsOf(user.name)}
              </span>
            )}
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void onAvatarPicked(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={avatarBusy}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon className="size-4" />
                {avatarBusy
                  ? "Working…"
                  : user.avatar
                    ? "Replace photo"
                    : "Upload photo"}
              </Button>
              {user.avatar && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={avatarBusy}
                  onClick={() => void onAvatarRemove()}
                >
                  <Trash2Icon className="size-4" />
                  Remove
                </Button>
              )}
            </div>
          </div>
          {avatarError && (
            <p className="mt-2 text-xs text-destructive">{avatarError}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
          <CardDescription>Your name and contact number.</CardDescription>
        </CardHeader>
        <CardContent>
          {state?.saved && (
            <FormAlert tone="success" className="mb-4">
              Profile updated.
            </FormAlert>
          )}
          {state?.formError && (
            <FormAlert className="mb-4">{state.formError}</FormAlert>
          )}

          <form className="space-y-4" action={formAction}>
            <div className="space-y-1.5">
              <label htmlFor="profile-name" className="text-sm font-medium">
                Full name
              </label>
              <Input
                id="profile-name"
                name="name"
                required
                autoComplete="name"
                className="h-10"
                value={values.name}
                onChange={update("name")}
              />
              <FieldError messages={state?.fieldErrors?.name} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-phone" className="text-sm font-medium">
                Phone{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="profile-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="01712345678"
                className="h-10"
                value={values.phone}
                onChange={update("phone")}
              />
              <FieldError messages={state?.fieldErrors?.phone} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="profile-email">
                Email
              </label>
              <Input
                id="profile-email"
                type="email"
                disabled
                className="h-10"
                value={user.email}
              />
              <p className="text-xs text-muted-foreground">
                Change it from the{" "}
                <Link
                  href="/account/security"
                  className="font-medium text-brand hover:underline"
                >
                  Security tab
                </Link>{" "}
                — it needs a confirmation from the new inbox.
              </p>
            </div>

            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
