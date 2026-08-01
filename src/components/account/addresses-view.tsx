"use client";

import * as React from "react";
import {
  BriefcaseIcon,
  HomeIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormAlert } from "@/components/auth/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
  type AddressPayload,
  type SavedAddress,
} from "@/lib/api/addresses";
import { ApiError } from "@/lib/api/client";
import { DISTRICTS, districtLabel } from "@/lib/bd-geo";
import { cn } from "@/lib/utils";

export const ADDRESS_LABELS = ["Home", "Office", "Others"] as const;

export function labelIcon(label: string | null) {
  if (label === "Home") return HomeIcon;
  if (label === "Office") return BriefcaseIcon;
  return MapPinIcon;
}

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** The address book — add, edit, delete and pick the checkout default. */
export function AddressesView() {
  const [addresses, setAddresses] = React.useState<SavedAddress[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<{
    address: SavedAddress | null;
  } | null>(null);
  const [toDelete, setToDelete] = React.useState<SavedAddress | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    return listAddresses()
      .then(setAddresses)
      .catch((err) => {
        setError(
          messageOf(err, "Could not load your addresses. Please try again."),
        );
      });
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function makeDefault(address: SavedAddress) {
    setBusy(true);
    setError(null);
    try {
      await setDefaultAddress(address.id);
      await load();
    } catch (err) {
      setError(messageOf(err, "Could not update the default address."));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAddress(toDelete.id);
      setToDelete(null);
      await load();
    } catch (err) {
      setError(messageOf(err, "Could not delete the address."));
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  }

  if (error && addresses === null) {
    return <FormAlert>{error}</FormAlert>;
  }
  if (addresses === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Saved addresses fill checkout in one tap — the default is
          pre-selected.
        </p>
        <Button size="sm" onClick={() => setDialog({ address: null })}>
          <PlusIcon data-icon="inline-start" />
          Add address
        </Button>
      </div>

      {error && <FormAlert>{error}</FormAlert>}

      {addresses.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center">
          <MapPinIcon className="size-8 text-muted-foreground" />
          <p className="font-heading mt-4 text-lg font-medium">
            No saved addresses
          </p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Add your home or office once and never type it at checkout again.
          </p>
        </div>
      )}

      {addresses.map((address) => {
        const Icon = labelIcon(address.label);
        return (
          <div
            key={address.id}
            className="flex items-start gap-3.5 rounded-xl border bg-card p-4 sm:p-5"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10">
              <Icon className="size-4 text-brand" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                {address.receiverName}
                {address.label && (
                  <Badge variant="outline">{address.label}</Badge>
                )}
                {address.isDefault && (
                  <Badge
                    variant="outline"
                    className="border-brand/30 bg-brand/10 text-brand"
                  >
                    Default
                  </Badge>
                )}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {address.address}, {districtLabel(address.district)}
              </p>
              <p className="text-sm text-muted-foreground">{address.phone}</p>
            </div>
            <div className="flex shrink-0 gap-1">
              {!address.isDefault && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Make ${address.label ?? "this address"} the default`}
                  disabled={busy}
                  onClick={() => void makeDefault(address)}
                  title="Make default"
                >
                  <StarIcon className="size-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit address"
                disabled={busy}
                onClick={() => setDialog({ address })}
              >
                <PencilIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete address"
                disabled={busy}
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setToDelete(address)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </div>
          </div>
        );
      })}

      {dialog && (
        <AddressDialog
          address={dialog.address}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            void load();
          }}
        />
      )}

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete address?</AlertDialogTitle>
          <AlertDialogDescription>
            {toDelete &&
              `"${toDelete.address}, ${districtLabel(toDelete.district)}" is removed — past orders keep their own copy.`}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" disabled={busy} />}
            >
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => void confirmDelete()}
            >
              {busy ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Create or edit one address — the same fields checkout collects. */
function AddressDialog({
  address,
  onClose,
  onSaved,
}: {
  address: SavedAddress | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = React.useState<string>(address?.label ?? "Home");
  const [receiverName, setReceiverName] = React.useState(
    address?.receiverName ?? "",
  );
  const [phone, setPhone] = React.useState(address?.phone ?? "");
  const [district, setDistrict] = React.useState<string | null>(
    address?.district ?? null,
  );
  const [street, setStreet] = React.useState(address?.address ?? "");
  const [makeDefault, setMakeDefault] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (receiverName.trim().length < 2) {
      setError("Enter the receiver's name.");
      return;
    }
    if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
      setError("Enter a valid 11-digit number, e.g. 01712345678.");
      return;
    }
    if (!district) {
      setError("Select the district.");
      return;
    }
    if (street.trim().length < 5) {
      setError("Write the full address — house, road, area.");
      return;
    }

    const payload: AddressPayload = {
      receiverName: receiverName.trim(),
      phone: cleanPhone,
      label,
      district,
      address: street.trim(),
      ...(makeDefault && { isDefault: true }),
    };

    setBusy(true);
    setError(null);
    try {
      if (address) {
        await updateAddress(address.id, payload);
        // PATCH deliberately ignores isDefault — the dedicated endpoint
        // clears the previous default in the same transaction.
        if (makeDefault && !address.isDefault) {
          await setDefaultAddress(address.id);
        }
      } else {
        await createAddress(payload);
      }
      onSaved();
    } catch (err) {
      setError(messageOf(err, "Could not save the address."));
      setBusy(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogTitle>{address ? "Edit address" : "Add address"}</DialogTitle>
        <DialogDescription>
          Pick it at checkout instead of typing it every time.
        </DialogDescription>

        {error && <FormAlert>{error}</FormAlert>}

        <div className="flex gap-2">
          {ADDRESS_LABELS.map((option) => {
            const Icon = labelIcon(option);
            const selected = label === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setLabel(option)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  selected
                    ? "border-brand bg-brand/10 text-brand"
                    : "text-muted-foreground hover:border-foreground/30",
                )}
              >
                <Icon className="size-3.5" />
                {option}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="addr-name" className="text-sm font-medium">
              Receiver&apos;s name
            </label>
            <Input
              id="addr-name"
              className="h-10"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="addr-phone" className="text-sm font-medium">
              Phone
            </label>
            <Input
              id="addr-phone"
              className="h-10"
              placeholder="01712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="addr-district" className="text-sm font-medium">
            District
          </label>
          <Select
            value={district}
            items={DISTRICTS}
            onValueChange={(v) => {
              if (v) setDistrict(v);
            }}
          >
            <SelectTrigger id="addr-district" className="h-10 w-full">
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {DISTRICTS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="addr-street" className="text-sm font-medium">
            Full address
          </label>
          <Textarea
            id="addr-street"
            className="min-h-16"
            placeholder="House, road, area"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
        </div>

        {!address?.isDefault && (
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={makeDefault}
              onChange={(e) => setMakeDefault(e.target.checked)}
            />
            <span className="text-sm">Make this my default address</span>
          </label>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="button" disabled={busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save address"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
