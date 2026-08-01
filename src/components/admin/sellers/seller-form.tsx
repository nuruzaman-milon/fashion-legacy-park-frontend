"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as z from "zod";

import { FieldError } from "@/components/auth/field-error";
import { FormAlert } from "@/components/auth/form-alert";
import { Badge } from "@/components/ui/badge";
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
import { STATUS_LOOKS } from "@/components/admin/sellers/seller-table";
import {
  createSeller,
  getAdminSeller,
  updateSeller,
  type AdminSeller,
  type SellerPayload,
} from "@/lib/api/admin/sellers";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";

const BD_PHONE = /^01[3-9]\d{8}$/;

/** Mirrors seller.validation.ts — regex fields reject empty, so "" is "unset". */
const sellerSchema = z.object({
  name: z.string().trim(),
  email: z.string().trim(),
  shopName: z
    .string()
    .trim()
    .min(2, "At least 2 characters")
    .max(150, "At most 150 characters"),
  contactName: z.string().trim().max(100, "At most 100 characters"),
  contactPhone: z
    .string()
    .trim()
    .regex(BD_PHONE, "A valid Bangladeshi mobile number, e.g. 017XXXXXXXX"),
  contactEmail: z
    .string()
    .trim()
    .refine((v) => v === "" || z.email().safeParse(v).success, {
      message: "Invalid email address",
    }),
  address: z.string().trim().max(255, "At most 255 characters"),
  commissionRate: z.coerce
    .number("Enter a number")
    .min(0, "Cannot be negative")
    .max(100, "At most 100"),
  bankAccountName: z.string().trim().max(100, "At most 100 characters"),
  bankAccountNumber: z.string().trim().max(50, "At most 50 characters"),
  bankName: z.string().trim().max(100, "At most 100 characters"),
  bankBranch: z.string().trim().max(100, "At most 100 characters"),
  bkashNumber: z
    .string()
    .trim()
    .refine((v) => v === "" || BD_PHONE.test(v), {
      message: "A valid Bangladeshi mobile number, e.g. 017XXXXXXXX",
    }),
});

interface FormState {
  fieldErrors?: Record<string, string[]>;
  formError?: string;
  saved?: boolean;
}

/** Create (`sellerId` absent) or edit a seller's shop and payout details. */
export function SellerForm({ sellerId }: { sellerId?: string }) {
  const [initial, setInitial] = React.useState<AdminSeller | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const ready = !sellerId || initial !== null;

  React.useEffect(() => {
    if (!sellerId) return;
    let cancelled = false;
    getAdminSeller(sellerId)
      .then((seller) => {
        if (!cancelled) setInitial(seller);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError && err.status === 404
              ? "This seller no longer exists."
              : err instanceof ApiError
                ? err.message
                : "Could not load the seller. Please try again.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  if (loadError) return <FormAlert>{loadError}</FormAlert>;
  if (!ready) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  return <SellerFormInner key={sellerId ?? "new"} initial={initial} />;
}

function SellerFormInner({ initial }: { initial: AdminSeller | null }) {
  const router = useRouter();

  // Controlled throughout — a failed save never wipes the edits.
  const [values, setValues] = React.useState(() => ({
    name: initial?.user.name ?? "",
    email: initial?.user.email ?? "",
    shopName: initial?.shopName ?? "",
    contactName: initial?.contactName ?? "",
    contactPhone: initial?.contactPhone ?? "",
    contactEmail: initial?.contactEmail ?? "",
    address: initial?.address ?? "",
    commissionRate: initial ? String(Number(initial.commissionRate)) : "0",
    bankAccountName: initial?.bankAccountName ?? "",
    bankAccountNumber: initial?.bankAccountNumber ?? "",
    bankName: initial?.bankName ?? "",
    bankBranch: initial?.bankBranch ?? "",
    bkashNumber: initial?.bkashNumber ?? "",
  }));

  const set = <K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  const [state, formAction, pending] = React.useActionState<
    FormState | undefined,
    FormData
  >(async () => {
    const parsed = sellerSchema.safeParse(values);
    if (!parsed.success) {
      return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
    }
    if (!initial) {
      if (parsed.data.name.length < 2) {
        return { fieldErrors: { name: ["At least 2 characters"] } };
      }
      if (!z.email().safeParse(parsed.data.email).success) {
        return { fieldErrors: { email: ["Invalid email address"] } };
      }
    }

    // Optional fields travel only when set — the backend's email/phone
    // formats reject empty strings.
    const d = parsed.data;
    const payload: SellerPayload = {
      shopName: d.shopName,
      contactPhone: d.contactPhone,
      commissionRate: d.commissionRate,
      ...(d.contactName && { contactName: d.contactName }),
      ...(d.contactEmail && { contactEmail: d.contactEmail }),
      ...(d.address && { address: d.address }),
      ...(d.bankAccountName && { bankAccountName: d.bankAccountName }),
      ...(d.bankAccountNumber && { bankAccountNumber: d.bankAccountNumber }),
      ...(d.bankName && { bankName: d.bankName }),
      ...(d.bankBranch && { bankBranch: d.bankBranch }),
      ...(d.bkashNumber && { bkashNumber: d.bkashNumber }),
    };

    try {
      if (initial) {
        await updateSeller(initial.id, payload);
        return { saved: true };
      }
      await createSeller({
        ...payload,
        name: d.name,
        email: d.email,
        shopName: d.shopName,
        contactPhone: d.contactPhone,
      });
      router.push("/admin/sellers");
      return undefined;
    } catch (error) {
      if (error instanceof ApiError) {
        return { formError: error.message, fieldErrors: error.fieldErrors };
      }
      return { formError: "Something went wrong. Please try again." };
    }
  }, undefined);

  const statusLook = initial ? STATUS_LOOKS[initial.status] : null;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.formError && <FormAlert>{state.formError}</FormAlert>}

      {initial && statusLook && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          <span className="font-mono font-medium">{initial.code}</span>
          <Badge variant="outline" className={statusLook.className}>
            {statusLook.label}
          </Badge>
          <span className="text-muted-foreground">
            {initial.user.name} · {initial.user.email}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">
            Joined {formatDate(initial.createdAt)}
            {initial.approvedAt &&
              ` · approved ${formatDate(initial.approvedAt)}`}
          </span>
        </div>
      )}

      {!initial && (
        <Card>
          <CardHeader>
            <CardTitle>Login account</CardTitle>
            <CardDescription>
              The seller receives a set-your-password email at this address —
              no password is chosen here.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="sl-name" className="text-sm font-medium">
                Owner name
              </label>
              <Input
                id="sl-name"
                required
                className="h-10"
                placeholder="Rahim Uddin"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.name} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sl-email" className="text-sm font-medium">
                Login email
              </label>
              <Input
                id="sl-email"
                type="email"
                required
                className="h-10"
                placeholder="rahim@example.com"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.email} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Shop</CardTitle>
          <CardDescription>
            What the store and its customers see, and who to reach.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="sl-shop" className="text-sm font-medium">
              Shop name
            </label>
            <Input
              id="sl-shop"
              required
              className="h-10"
              placeholder="Rahim Fashion House"
              value={values.shopName}
              onChange={(e) => set("shopName", e.target.value)}
            />
            <FieldError messages={state?.fieldErrors?.shopName} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="sl-contact" className="text-sm font-medium">
                Contact person{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="sl-contact"
                className="h-10"
                value={values.contactName}
                onChange={(e) => set("contactName", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.contactName} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sl-phone" className="text-sm font-medium">
                Contact phone
              </label>
              <Input
                id="sl-phone"
                required
                className="h-10"
                placeholder="017XXXXXXXX"
                value={values.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.contactPhone} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="sl-cemail" className="text-sm font-medium">
                Contact email{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="sl-cemail"
                className="h-10"
                value={values.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.contactEmail} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sl-commission" className="text-sm font-medium">
                Commission (%)
              </label>
              <Input
                id="sl-commission"
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="h-10"
                value={values.commissionRate}
                onChange={(e) => set("commissionRate", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The platform&apos;s cut of their gross sales.
              </p>
              <FieldError messages={state?.fieldErrors?.commissionRate} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="sl-address" className="text-sm font-medium">
              Address{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Textarea
              id="sl-address"
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
            Where their earnings go — bank transfer, bKash, or both. All
            optional until the first payout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="sl-bank-owner" className="text-sm font-medium">
                Account holder
              </label>
              <Input
                id="sl-bank-owner"
                className="h-10"
                value={values.bankAccountName}
                onChange={(e) => set("bankAccountName", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.bankAccountName} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sl-bank-no" className="text-sm font-medium">
                Account number
              </label>
              <Input
                id="sl-bank-no"
                className="h-10"
                value={values.bankAccountNumber}
                onChange={(e) => set("bankAccountNumber", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.bankAccountNumber} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="sl-bank" className="text-sm font-medium">
                Bank
              </label>
              <Input
                id="sl-bank"
                className="h-10"
                placeholder="BRAC Bank"
                value={values.bankName}
                onChange={(e) => set("bankName", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.bankName} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="sl-branch" className="text-sm font-medium">
                Branch
              </label>
              <Input
                id="sl-branch"
                className="h-10"
                value={values.bankBranch}
                onChange={(e) => set("bankBranch", e.target.value)}
              />
              <FieldError messages={state?.fieldErrors?.bankBranch} />
            </div>
          </div>
          <div className="space-y-1.5 sm:max-w-[calc(50%-0.5rem)]">
            <label htmlFor="sl-bkash" className="text-sm font-medium">
              bKash number
            </label>
            <Input
              id="sl-bkash"
              className="h-10"
              placeholder="017XXXXXXXX"
              value={values.bkashNumber}
              onChange={(e) => set("bkashNumber", e.target.value)}
            />
            <FieldError messages={state?.fieldErrors?.bkashNumber} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : initial
              ? "Save changes"
              : "Create seller & send invite"}
        </Button>
        <Button
          type="button"
          variant="outline"
          render={<Link href="/admin/sellers" />}
        >
          {initial ? "Back to sellers" : "Cancel"}
        </Button>
        {state?.saved && !pending && (
          <span className="text-sm text-muted-foreground">Changes saved.</span>
        )}
      </div>
    </form>
  );
}
