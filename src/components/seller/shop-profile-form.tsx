"use client";

import * as React from "react";
import * as z from "zod";

import { SellerStatusBadge } from "@/components/seller/seller-status";
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import {
  getSellerProfile,
  updateSellerProfile,
  type SellerProfile,
  type SellerProfilePayload,
} from "@/lib/api/seller/profile";
import { formatDate } from "@/lib/format";

/**
 * Mirrors seller.validation.ts's self-update schema. Formatted fields are
 * validated only when filled — the backend rejects "" and a saved value can
 * only be replaced, not cleared (admin gotcha shared by the sellers module).
 */
const profileSchema = z
  .object({
    shopName: z
      .string()
      .trim()
      .min(2, "At least 2 characters")
      .max(150, "At most 150 characters"),
    contactName: z.string().trim().max(100, "At most 100 characters"),
    contactPhone: z.string().trim(),
    contactEmail: z.string().trim(),
    address: z.string().trim().max(255, "At most 255 characters"),
    bankAccountName: z.string().trim().max(100, "At most 100 characters"),
    bankAccountNumber: z.string().trim().max(50, "At most 50 characters"),
    bankName: z.string().trim().max(100, "At most 100 characters"),
    bankBranch: z.string().trim().max(100, "At most 100 characters"),
    bkashNumber: z.string().trim(),
  })
  .superRefine((v, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", message, path: [path] });
    const phoneOk = (raw: string) => /^01[3-9]\d{8}$/.test(raw);

    if (v.contactPhone !== "" && !phoneOk(v.contactPhone)) {
      issue("contactPhone", "Enter a valid 11-digit number, e.g. 01712345678");
    }
    if (v.bkashNumber !== "" && !phoneOk(v.bkashNumber)) {
      issue("bkashNumber", "Enter a valid 11-digit bKash number");
    }
    if (v.contactEmail !== "" && !/^\S+@\S+\.\S+$/.test(v.contactEmail)) {
      issue("contactEmail", "Enter a valid email address");
    }
  });

interface FormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  saved?: boolean;
}

/** Loads the shop, then hands off to the controlled inner form. */
export function ShopProfileForm() {
  const [initial, setInitial] = React.useState<SellerProfile | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getSellerProfile()
      .then((profile) => {
        if (!cancelled) setInitial(profile);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError
              ? err.message
              : "Could not load your shop profile. Please try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) return <FormAlert>{loadError}</FormAlert>;
  if (initial === null) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  return <ShopProfileFormInner initial={initial} />;
}

function ShopProfileFormInner({ initial }: { initial: SellerProfile }) {
  // Controlled throughout — a failed save never wipes the edits.
  const [values, setValues] = React.useState(() => ({
    shopName: initial.shopName,
    contactName: initial.contactName ?? "",
    contactPhone: initial.contactPhone,
    contactEmail: initial.contactEmail ?? "",
    address: initial.address ?? "",
    bankAccountName: initial.bankAccountName ?? "",
    bankAccountNumber: initial.bankAccountNumber ?? "",
    bankName: initial.bankName ?? "",
    bankBranch: initial.bankBranch ?? "",
    bkashNumber: initial.bkashNumber ?? "",
  }));

  const set = <K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  const [state, formAction, pending] = React.useActionState<
    FormState | undefined,
    FormData
  >(async () => {
    const parsed = profileSchema.safeParse(values);
    if (!parsed.success) {
      return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }

    // Empty strings are omitted, not sent — the backend's format checks
    // reject "" and nothing here is nullable.
    const payload: SellerProfilePayload = { shopName: parsed.data.shopName };
    const optional = [
      "contactName",
      "contactPhone",
      "contactEmail",
      "address",
      "bankAccountName",
      "bankAccountNumber",
      "bankName",
      "bankBranch",
      "bkashNumber",
    ] as const;
    for (const key of optional) {
      const value = values[key].trim();
      if (value !== "") payload[key] = value;
    }

    try {
      await updateSellerProfile(payload);
      return { saved: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return { formError: error.message, fieldErrors: error.fieldErrors };
      }
      return { formError: "Something went wrong. Please try again." };
    }
  }, undefined);

  const field = (
    key: keyof typeof values,
    label: string,
    props?: React.ComponentProps<typeof Input> & { optional?: boolean },
  ) => {
    const { optional, ...inputProps } = props ?? {};
    return (
      <div className="space-y-1.5">
        <label htmlFor={`shop-${key}`} className="text-sm font-medium">
          {label}{" "}
          {optional && (
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          )}
        </label>
        <Input
          id={`shop-${key}`}
          className="h-10"
          value={values[key]}
          onChange={(e) => set(key, e.target.value)}
          {...inputProps}
        />
        <FieldError messages={state?.fieldErrors?.[key]} />
      </div>
    );
  };

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border bg-card px-4 py-3 text-sm">
        <span className="font-mono font-medium">{initial.code}</span>
        <SellerStatusBadge status={initial.status} />
        <span className="text-muted-foreground">
          Commission {Number(initial.commissionRate)}% · Selling since{" "}
          {formatDate(initial.createdAt)}
        </span>
      </div>

      {state?.saved && !pending && (
        <FormAlert tone="success">Changes saved.</FormAlert>
      )}
      {state?.formError && <FormAlert>{state.formError}</FormAlert>}

      <Card>
        <CardHeader>
          <CardTitle>Shop</CardTitle>
          <CardDescription>
            The name customers see, and how the platform reaches you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {field("shopName", "Shop name", { required: true })}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("contactName", "Contact person", { optional: true })}
            {field("contactPhone", "Contact phone", {
              placeholder: "01712345678",
            })}
          </div>
          {field("contactEmail", "Contact email", {
            optional: true,
            type: "email",
            placeholder: "shop@example.com",
          })}
          <div className="space-y-1.5">
            <label htmlFor="shop-address" className="text-sm font-medium">
              Address{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Textarea
              id="shop-address"
              className="min-h-16"
              value={values.address}
              onChange={(e) => set("address", e.target.value)}
            />
            <FieldError messages={state?.fieldErrors?.address} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payouts</CardTitle>
          <CardDescription>
            Where your earnings go. A saved value can be replaced but not
            cleared — contact support to remove one.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {field("bkashNumber", "bKash number", {
            optional: true,
            placeholder: "01712345678",
          })}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("bankAccountName", "Account name", { optional: true })}
            {field("bankAccountNumber", "Account number", { optional: true })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("bankName", "Bank", { optional: true })}
            {field("bankBranch", "Branch", { optional: true })}
          </div>
        </CardContent>
      </Card>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
