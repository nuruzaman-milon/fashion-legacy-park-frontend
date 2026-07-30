"use client";

import * as React from "react";
import {
  EllipsisIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FormAlert } from "@/components/auth/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  createOption,
  createOptionValue,
  deleteOption,
  deleteOptionValue,
  getAdminOptions,
  updateOption,
  updateOptionValue,
  type AdminOption,
  type AdminOptionValue,
  type OptionDisplayType,
} from "@/lib/api/admin/options";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

const DISPLAY_TYPES: { value: OptionDisplayType; label: string }[] = [
  { value: "DROPDOWN", label: "Dropdown" },
  { value: "SWATCH", label: "Colour swatch" },
  { value: "BUTTON", label: "Buttons" },
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

// ---------------------------------------------------------------------------
// Option create/edit dialog
// ---------------------------------------------------------------------------

function OptionDialog({
  initial,
  open,
  onClose,
  onDone,
}: {
  /** Absent = create. */
  initial?: AdminOption;
  open: boolean;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      {open && (
        <OptionDialogForm
          key={initial?.id ?? "new"}
          initial={initial}
          onClose={onClose}
          onDone={onDone}
        />
      )}
    </Dialog>
  );
}

function OptionDialogForm({
  initial,
  onClose,
  onDone,
}: {
  initial?: AdminOption;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [displayType, setDisplayType] = React.useState<OptionDisplayType>(
    initial?.displayType ?? "DROPDOWN",
  );
  const [sortOrder, setSortOrder] = React.useState(
    String(initial?.sortOrder ?? 0),
  );
  const [isActive, setIsActive] = React.useState(initial?.isActive ?? true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    const trimmed = name.trim();
    const sort = Number(sortOrder);
    if (trimmed.length < 1 || trimmed.length > 50) {
      setError("Name must be 1–50 characters");
      return;
    }
    if (!Number.isInteger(sort)) {
      setError("Sort order must be a whole number");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (initial) {
        await updateOption(initial.id, {
          name: trimmed,
          sortOrder: sort,
          isActive,
        });
      } else {
        await createOption({
          name: trimmed,
          displayType,
          sortOrder: sort,
          isActive,
        });
      }
      await onDone();
      onClose();
    } catch (err) {
      setError(messageOf(err, "Could not save the option."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogContent>
      <DialogTitle>{initial ? `Edit ${initial.name}` : "New option"}</DialogTitle>
      {error && <FormAlert>{error}</FormAlert>}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="opt-name" className="text-sm font-medium">
            Name
          </label>
          <Input
            id="opt-name"
            placeholder="Color"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" id="opt-display-label">
            Shown as
          </label>
          <Select
            value={displayType}
            items={DISPLAY_TYPES}
            onValueChange={(v) => {
              if (v) setDisplayType(v);
            }}
            disabled={initial !== undefined}
          >
            <SelectTrigger
              aria-labelledby="opt-display-label"
              className="w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISPLAY_TYPES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {initial ? (
            <p className="text-xs text-muted-foreground">
              The display type is fixed after creation.
            </p>
          ) : (
            displayType === "SWATCH" && (
              <p className="text-xs text-muted-foreground">
                Swatch values each need a colour.
              </p>
            )
          )}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="opt-sort" className="text-sm font-medium">
            Sort order
          </label>
          <Input
            id="opt-sort"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <label
          htmlFor="opt-active"
          className="flex cursor-pointer items-center justify-between gap-3"
        >
          <span className="text-sm">
            <span className="block font-medium">Active</span>
            <span className="text-muted-foreground">
              Offered when building products
            </span>
          </span>
          <Switch
            id="opt-active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </label>
      </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" disabled={busy} />}>
          Cancel
        </DialogClose>
        <Button disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : initial ? "Save" : "Create"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ---------------------------------------------------------------------------
// Value create/edit dialog
// ---------------------------------------------------------------------------

function ValueDialog({
  option,
  initial,
  open,
  onClose,
  onDone,
  onDelete,
}: {
  option: AdminOption;
  /** Absent = create. */
  initial?: AdminOptionValue;
  open: boolean;
  onClose: () => void;
  onDone: () => Promise<void>;
  /** Hands the value back to the manager's delete-confirm dialog. */
  onDelete: (value: AdminOptionValue) => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      {open && (
        <ValueDialogForm
          key={initial?.id ?? "new"}
          option={option}
          initial={initial}
          onClose={onClose}
          onDone={onDone}
          onDelete={onDelete}
        />
      )}
    </Dialog>
  );
}

function ValueDialogForm({
  option,
  initial,
  onClose,
  onDone,
  onDelete,
}: {
  option: AdminOption;
  initial?: AdminOptionValue;
  onClose: () => void;
  onDone: () => Promise<void>;
  onDelete: (value: AdminOptionValue) => void;
}) {
  const isSwatch = option.displayType === "SWATCH";
  const [value, setValue] = React.useState(initial?.value ?? "");
  const [hexColor, setHexColor] = React.useState(
    initial?.hexColor ?? (isSwatch ? "#b91c1c" : ""),
  );
  const [sortOrder, setSortOrder] = React.useState(
    String(initial?.sortOrder ?? option.values.length),
  );
  const [isActive, setIsActive] = React.useState(initial?.isActive ?? true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    const trimmed = value.trim();
    const sort = Number(sortOrder);
    const hex = hexColor.trim();
    if (trimmed.length < 1 || trimmed.length > 50) {
      setError("Value must be 1–50 characters");
      return;
    }
    if (!Number.isInteger(sort)) {
      setError("Sort order must be a whole number");
      return;
    }
    if ((isSwatch || hex) && !HEX_RE.test(hex)) {
      setError("Colour must be a hex code like #b91c1c");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        value: trimmed,
        hexColor: hex ? hex : null,
        sortOrder: sort,
        isActive,
      };
      if (initial) await updateOptionValue(initial.id, payload);
      else await createOptionValue(option.id, payload);
      await onDone();
      onClose();
    } catch (err) {
      setError(messageOf(err, "Could not save the value."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <DialogContent>
      <DialogTitle>
        {initial ? `Edit ${initial.value}` : `New ${option.name} value`}
      </DialogTitle>
      {error && <FormAlert>{error}</FormAlert>}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="val-name" className="text-sm font-medium">
            Value
          </label>
          <Input
            id="val-name"
            placeholder={isSwatch ? "Red" : "XL"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="val-hex" className="text-sm font-medium">
            Colour{" "}
            {!isSwatch && (
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            )}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Pick a colour"
              className="size-9 shrink-0 cursor-pointer rounded-lg border border-input bg-transparent p-1"
              value={HEX_RE.test(hexColor) ? hexColor : "#b91c1c"}
              onChange={(e) => setHexColor(e.target.value)}
            />
            <Input
              id="val-hex"
              placeholder="#b91c1c"
              className="font-mono"
              value={hexColor}
              onChange={(e) => setHexColor(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="val-sort" className="text-sm font-medium">
            Sort order
          </label>
          <Input
            id="val-sort"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <label
          htmlFor="val-active"
          className="flex cursor-pointer items-center justify-between gap-3"
        >
          <span className="text-sm">
            <span className="block font-medium">Active</span>
            <span className="text-muted-foreground">
              Offered when generating variants
            </span>
          </span>
          <Switch
            id="val-active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </label>
      </div>
      <DialogFooter className={cn(initial && "justify-between")}>
        {initial && (
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => onDelete(initial)}
          >
            <Trash2Icon className="size-4" />
            Delete
          </Button>
        )}
        <div className="flex gap-2">
          <DialogClose render={<Button variant="outline" disabled={busy} />}>
            Cancel
          </DialogClose>
          <Button disabled={busy} onClick={() => void save()}>
            {busy ? "Saving…" : initial ? "Save" : "Add value"}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type DialogState =
  | { kind: "closed" }
  | { kind: "new-option" }
  | { kind: "edit-option"; option: AdminOption }
  | { kind: "new-value"; option: AdminOption }
  | { kind: "edit-value"; option: AdminOption; value: AdminOptionValue }
  | { kind: "delete-option"; option: AdminOption }
  | { kind: "delete-value"; option: AdminOption; value: AdminOptionValue };

/**
 * The global option library: one card per option, its values inline. Deletes
 * surface the backend's 409 ("used by N products/variants — deactivate
 * instead") rather than pre-checking.
 */
export function OptionsManager() {
  const [options, setOptions] = React.useState<AdminOption[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [dialog, setDialog] = React.useState<DialogState>({ kind: "closed" });
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    return getAdminOptions()
      .then(setOptions)
      .catch((err) => {
        setLoadError(messageOf(err, "Could not load the option library."));
      });
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const close = () => setDialog({ kind: "closed" });

  async function confirmDelete() {
    if (dialog.kind !== "delete-option" && dialog.kind !== "delete-value")
      return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      if (dialog.kind === "delete-option") await deleteOption(dialog.option.id);
      else await deleteOptionValue(dialog.value.id);
      await load();
      close();
    } catch (err) {
      setDeleteError(messageOf(err, "Could not delete. Please try again."));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Options"
        description="The shared library of variant axes — defined once, reused by every product."
      >
        <Button onClick={() => setDialog({ kind: "new-option" })}>
          <PlusIcon data-icon="inline-start" />
          New option
        </Button>
      </PageHeader>

      {loadError && (
        <div className="space-y-3">
          <FormAlert>{loadError}</FormAlert>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoadError(null);
              void load();
            }}
          >
            Try again
          </Button>
        </div>
      )}

      {options === null && !loadError && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 2 }, (_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent className="flex gap-2">
                <Skeleton className="h-7 w-16 rounded-lg" />
                <Skeleton className="h-7 w-16 rounded-lg" />
                <Skeleton className="h-7 w-16 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {options?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            The library is empty — create the first option (e.g. Size or
            Color).
          </CardContent>
        </Card>
      )}

      {options?.map((option) => (
        <Card key={option.id}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {option.name}
              <Badge variant="outline">
                {DISPLAY_TYPES.find((t) => t.value === option.displayType)
                  ?.label ?? option.displayType}
              </Badge>
              {!option.isActive && (
                <Badge variant="outline" className="text-muted-foreground">
                  Hidden
                </Badge>
              )}
              <span className="text-xs font-normal text-muted-foreground">
                {option.productCount > 0
                  ? `used by ${option.productCount} ${option.productCount === 1 ? "product" : "products"}`
                  : "not used yet"}
              </span>
            </CardTitle>
            <CardAction>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${option.name}`}
                    />
                  }
                >
                  <EllipsisIcon className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setDialog({ kind: "edit-option", option })}
                  >
                    <PencilIcon className="size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive data-highlighted:bg-destructive data-highlighted:text-white"
                    onClick={() => {
                      setDeleteError(null);
                      setDialog({ kind: "delete-option", option });
                    }}
                  >
                    <Trash2Icon className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-1.5">
            {option.values.map((value) => (
              <button
                key={value.id}
                type="button"
                onClick={() =>
                  setDialog({ kind: "edit-value", option, value })
                }
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm transition-colors hover:bg-muted",
                  !value.isActive && "opacity-50",
                )}
              >
                {value.hexColor && (
                  <span
                    aria-hidden
                    className="size-3 rounded-full border border-foreground/20"
                    style={{ backgroundColor: value.hexColor }}
                  />
                )}
                {value.value}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setDialog({ kind: "new-value", option })}
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-dashed border-border px-2.5 text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
            >
              <PlusIcon className="size-3.5" />
              Add value
            </button>
          </CardContent>
        </Card>
      ))}

      <OptionDialog
        open={dialog.kind === "new-option" || dialog.kind === "edit-option"}
        initial={dialog.kind === "edit-option" ? dialog.option : undefined}
        onClose={close}
        onDone={load}
      />

      {(dialog.kind === "new-value" || dialog.kind === "edit-value") && (
        <ValueDialog
          open
          option={dialog.option}
          initial={dialog.kind === "edit-value" ? dialog.value : undefined}
          onClose={close}
          onDone={load}
          onDelete={(value) => {
            setDeleteError(null);
            setDialog({ kind: "delete-value", option: dialog.option, value });
          }}
        />
      )}

      <AlertDialog
        open={
          dialog.kind === "delete-option" || dialog.kind === "delete-value"
        }
        onOpenChange={(open) => {
          if (!open && !deleteBusy) close();
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {dialog.kind === "delete-option"
              ? "Delete option?"
              : "Delete value?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {dialog.kind === "delete-option"
              ? `"${dialog.option.name}" and all its values will be removed.`
              : dialog.kind === "delete-value"
                ? `"${dialog.value.value}" will be removed from ${dialog.option.name}.`
                : null}
          </AlertDialogDescription>
          {deleteError && <FormAlert>{deleteError}</FormAlert>}
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" disabled={deleteBusy} />}
            >
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              disabled={deleteBusy}
              onClick={() => void confirmDelete()}
            >
              {deleteBusy ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
