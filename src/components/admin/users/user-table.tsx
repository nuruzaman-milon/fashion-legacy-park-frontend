"use client";

import * as React from "react";
import Image from "next/image";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  SearchIcon,
  ShieldIcon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { FormAlert } from "@/components/auth/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listAdminUsers,
  updateUserRole,
  updateUserStatus,
  type AdminUserRow,
  type AssignableRole,
} from "@/lib/api/admin/users";
import { ApiError } from "@/lib/api/client";
import { formatDate, formatRelativeTime } from "@/lib/format";
import type { PaginationMeta } from "@/types/admin";
import type { Role } from "@/types/auth";

const ALL = "__all__";

const ROLE_FILTER: { value: string; label: string }[] = [
  { value: ALL, label: "All roles" },
  { value: "CUSTOMER", label: "Customers" },
  { value: "SELLER", label: "Sellers" },
  { value: "ADMIN", label: "Admins" },
  { value: "SUPER_ADMIN", label: "Super admins" },
];

const STATUS_FILTER: { value: string; label: string }[] = [
  { value: ALL, label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Deactivated" },
];

const VERIFIED_FILTER: { value: string; label: string }[] = [
  { value: ALL, label: "Verified & not" },
  { value: "verified", label: "Email verified" },
  { value: "unverified", label: "Unverified" },
];

const ROLE_LOOKS: Record<Role, { label: string; className: string }> = {
  SUPER_ADMIN: {
    label: "Super admin",
    className:
      "border-violet-600/25 bg-violet-600/10 text-violet-700 dark:text-violet-400",
  },
  ADMIN: {
    label: "Admin",
    className:
      "border-sky-600/25 bg-sky-600/10 text-sky-700 dark:text-sky-400",
  },
  SELLER: { label: "Seller", className: "" },
  CUSTOMER: { label: "Customer", className: "text-muted-foreground" },
};

/** The roles PATCH /role accepts — SELLER is managed via seller endpoints. */
const ASSIGNABLE: { value: AssignableRole; label: string }[] = [
  { value: "CUSTOMER", label: "Customer" },
  { value: "ADMIN", label: "Admin" },
  { value: "SUPER_ADMIN", label: "Super admin" },
];

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function RowsSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-36" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-4xl" /></TableCell>
          <TableCell><Skeleton className="h-5 w-14 rounded-4xl" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
          <TableCell />
        </TableRow>
      ))}
    </>
  );
}

/**
 * Server-driven user table: search and the three filters map straight onto
 * the query params of `GET /admin/users`; pagination comes from its meta.
 */
export function UserTable() {
  const { user: me } = useAuth();
  const iAmSuperAdmin = me?.role === "SUPER_ADMIN";

  // The fetch result remembers which query it answered; "loading" is derived
  // (result key ≠ current key) instead of set synchronously in the effect.
  const [result, setResult] = React.useState<{
    key: string;
    data: { items: AdminUserRow[]; meta: PaginationMeta };
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [role, setRole] = React.useState<string>(ALL);
  const [status, setStatus] = React.useState<string>(ALL);
  const [verified, setVerified] = React.useState<string>(ALL);
  const [page, setPage] = React.useState(1);
  const [refreshTick, setRefreshTick] = React.useState(0);

  const [roleDialog, setRoleDialog] = React.useState<AdminUserRow | null>(null);
  const [toDeactivate, setToDeactivate] =
    React.useState<AdminUserRow | null>(null);
  const [actionBusy, setActionBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const queryKey = [page, debouncedSearch, role, status, verified, refreshTick]
    .map(String)
    .join("|");

  React.useEffect(() => {
    let cancelled = false;
    listAdminUsers({
      page,
      search: debouncedSearch || undefined,
      role: role === ALL ? undefined : (role as Role),
      isActive: status === ALL ? undefined : status === "active",
      isVerified: verified === ALL ? undefined : verified === "verified",
    })
      .then((data) => {
        if (cancelled) return;
        setResult({ key: queryKey, data });
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(messageOf(err, "Could not load users. Please try again."));
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, role, status, verified, refreshTick, queryKey]);

  const loading = !error && result?.key !== queryKey;
  const data = result?.data ?? null;
  const meta = data?.meta;

  // Filters reset paging — page 5 of "Admins" makes no sense after switching.
  const applyFilter = (apply: () => void) => {
    setPage(1);
    apply();
  };

  const refresh = () => setRefreshTick((t) => t + 1);

  async function setStatusFor(user: AdminUserRow, isActive: boolean) {
    setActionBusy(true);
    setActionError(null);
    try {
      await updateUserStatus(user.id, isActive);
      setToDeactivate(null);
      refresh();
    } catch (err) {
      setActionError(messageOf(err, "Could not update the account."));
      if (isActive) setToDeactivate(null); // reactivation has no dialog
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search name, email or phone…"
            aria-label="Search users"
            className="h-9 pl-8"
            value={search}
            onChange={(e) => applyFilter(() => setSearch(e.target.value))}
          />
        </div>
        <Select
          value={role}
          items={ROLE_FILTER}
          onValueChange={(v) => applyFilter(() => setRole(v ?? ALL))}
        >
          <SelectTrigger aria-label="Filter by role" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_FILTER.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status}
          items={STATUS_FILTER}
          onValueChange={(v) => applyFilter(() => setStatus(v ?? ALL))}
        >
          <SelectTrigger aria-label="Filter by status" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={verified}
          items={VERIFIED_FILTER}
          onValueChange={(v) => applyFilter(() => setVerified(v ?? ALL))}
        >
          <SelectTrigger aria-label="Filter by verification" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VERIFIED_FILTER.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {actionError && <FormAlert>{actionError}</FormAlert>}

      {error ? (
        <div className="space-y-3">
          <FormAlert>{error}</FormAlert>
          <Button variant="outline" size="sm" onClick={refresh}>
            Try again
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last login</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <RowsSkeleton />}
            {!loading && data?.items.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No users match these filters.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              data?.items.map((u) => {
                const isMe = u.id === me?.id;
                const roleLook = ROLE_LOOKS[u.role];
                const canChangeRole =
                  iAmSuperAdmin && !isMe && u.role !== "SELLER";
                const canToggle = !isMe;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <Image
                            src={u.avatar}
                            alt=""
                            width={36}
                            height={36}
                            className="size-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                            {u.name[0]?.toUpperCase() ?? "?"}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {u.name}
                            {isMe && (
                              <Badge
                                variant="outline"
                                className="ml-1.5 text-[10px]"
                              >
                                You
                              </Badge>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {u.email}
                            {u.phone && <> · {u.phone}</>}
                            {!u.emailVerifiedAt && (
                              <span className="text-amber-700 dark:text-amber-400">
                                {" "}
                                · unverified
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleLook.className}>
                        {roleLook.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-600/25 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-destructive/25 bg-destructive/10 text-destructive"
                        >
                          Deactivated
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {u.lastLoginAt ? formatRelativeTime(u.lastLoginAt) : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      {(canChangeRole || canToggle) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for ${u.name}`}
                              />
                            }
                          >
                            <EllipsisIcon className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canChangeRole && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setActionError(null);
                                  setRoleDialog(u);
                                }}
                              >
                                <ShieldIcon className="size-4" />
                                Change role
                              </DropdownMenuItem>
                            )}
                            {canToggle &&
                              (u.isActive ? (
                                <DropdownMenuItem
                                  className="text-destructive data-highlighted:bg-destructive data-highlighted:text-white"
                                  onClick={() => {
                                    setActionError(null);
                                    setToDeactivate(u);
                                  }}
                                >
                                  <UserXIcon className="size-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => void setStatusFor(u, true)}
                                >
                                  <UserCheckIcon className="size-4" />
                                  Reactivate
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      )}

      {meta && !error && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {meta.total} {meta.total === 1 ? "user" : "users"}
            {meta.totalPages > 1 && ` · page ${meta.page} of ${meta.totalPages}`}
          </p>
          {meta.totalPages > 1 && (
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                disabled={!meta.hasPrev || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                disabled={!meta.hasNext || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {roleDialog && (
        <RoleDialog
          user={roleDialog}
          onClose={() => setRoleDialog(null)}
          onSaved={() => {
            setRoleDialog(null);
            refresh();
          }}
        />
      )}

      <AlertDialog
        open={toDeactivate !== null}
        onOpenChange={(open) => {
          if (!open && !actionBusy) setToDeactivate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Deactivate account?</AlertDialogTitle>
          <AlertDialogDescription>
            {toDeactivate &&
              `"${toDeactivate.name}" is signed out everywhere immediately and cannot log in until reactivated.`}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" disabled={actionBusy} />}
            >
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              disabled={actionBusy}
              onClick={() => {
                if (toDeactivate) void setStatusFor(toDeactivate, false);
              }}
            >
              {actionBusy ? "Deactivating…" : "Deactivate"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function RoleDialog({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUserRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = React.useState<AssignableRole>(
    user.role === "SELLER" ? "CUSTOMER" : user.role,
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    if (role === user.role) {
      onClose();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateUserRole(user.id, role);
      onSaved();
    } catch (err) {
      setError(messageOf(err, "Could not change the role."));
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
      <DialogContent>
        <DialogTitle>Change role</DialogTitle>
        <DialogDescription>
          {user.name} · {user.email}
        </DialogDescription>

        {error && <FormAlert>{error}</FormAlert>}

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="role-select">
            Role
          </label>
          <Select
            value={role}
            items={ASSIGNABLE}
            onValueChange={(v) => {
              if (v) setRole(v as AssignableRole);
            }}
          >
            <SelectTrigger id="role-select" className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSIGNABLE.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {role !== "CUSTOMER" && (
            <p className="text-xs text-muted-foreground">
              {role === "SUPER_ADMIN"
                ? "Full control, including granting roles to others."
                : "Runs the store day to day; cannot change anyone's role."}
            </p>
          )}
        </div>

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
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
