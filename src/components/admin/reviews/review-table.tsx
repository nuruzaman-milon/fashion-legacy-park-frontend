"use client";

import * as React from "react";
import Link from "next/link";
import {
  BadgeCheckIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  MessageSquareReplyIcon,
  SearchIcon,
  StarIcon,
  Trash2Icon,
  XIcon,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Textarea } from "@/components/ui/textarea";
import {
  deleteReview,
  listAdminReviews,
  replyToReview,
  setReviewStatus,
  type AdminReview,
  type ReviewStatus,
} from "@/lib/api/admin/reviews";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { PaginationMeta } from "@/types/admin";

const ALL = "__all__";

const STATUS_FILTER: { value: string; label: string }[] = [
  { value: ALL, label: "All statuses" },
  { value: "PENDING", label: "Awaiting moderation" },
  { value: "APPROVED", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_LOOKS: Record<ReviewStatus, { label: string; className: string }> =
  {
    PENDING: {
      label: "Pending",
      className:
        "border-amber-600/25 bg-amber-600/10 text-amber-700 dark:text-amber-400",
    },
    APPROVED: {
      label: "Published",
      className:
        "border-emerald-600/25 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
    },
    REJECTED: {
      label: "Rejected",
      className: "border-destructive/25 bg-destructive/10 text-destructive",
    },
  };

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          className={`size-3.5 ${
            n <= rating
              ? "fill-brand text-brand"
              : "text-muted-foreground/40"
          }`}
        />
      ))}
    </span>
  );
}

function RowsSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <TableRow key={i} className="hover:bg-transparent">
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-4xl" /></TableCell>
          <TableCell><Skeleton className="h-3.5 w-20" /></TableCell>
          <TableCell />
        </TableRow>
      ))}
    </>
  );
}

/** Moderation queue — approve/reject publishes or hides, reply talks back. */
export function ReviewTable() {
  const [result, setResult] = React.useState<{
    key: string;
    data: { items: AdminReview[]; meta: PaginationMeta };
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [status, setStatus] = React.useState<string>(ALL);
  const [page, setPage] = React.useState(1);
  const [refreshTick, setRefreshTick] = React.useState(0);

  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [replyFor, setReplyFor] = React.useState<AdminReview | null>(null);
  const [toDelete, setToDelete] = React.useState<AdminReview | null>(null);

  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(handle);
  }, [search]);

  const queryKey = [page, debouncedSearch, status, refreshTick]
    .map(String)
    .join("|");

  React.useEffect(() => {
    let cancelled = false;
    listAdminReviews({
      page,
      search: debouncedSearch || undefined,
      status: status === ALL ? undefined : (status as ReviewStatus),
    })
      .then((data) => {
        if (cancelled) return;
        setResult({ key: queryKey, data });
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(messageOf(err, "Could not load reviews. Please try again."));
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, status, refreshTick, queryKey]);

  const loading = !error && result?.key !== queryKey;
  const data = result?.data ?? null;
  const meta = data?.meta;
  const refresh = () => setRefreshTick((t) => t + 1);

  async function moderate(review: AdminReview, next: "APPROVED" | "REJECTED") {
    setBusyId(review.id);
    setActionError(null);
    try {
      await setReviewStatus(review.id, next);
      refresh();
    } catch (err) {
      setActionError(messageOf(err, "Could not update the review."));
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusyId(toDelete.id);
    setActionError(null);
    try {
      await deleteReview(toDelete.id);
      setToDelete(null);
      refresh();
    } catch (err) {
      setActionError(messageOf(err, "Could not delete the review."));
      setToDelete(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search product, reviewer or words…"
            aria-label="Search reviews"
            className="h-9 pl-8"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <Select
          value={status}
          items={STATUS_FILTER}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v ?? ALL);
          }}
        >
          <SelectTrigger aria-label="Filter by status" className="w-48">
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
              <TableHead>Review</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Written</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <RowsSkeleton />}
            {!loading && data?.items.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  {status === "PENDING"
                    ? "Nothing awaiting moderation."
                    : "No reviews match these filters."}
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              data?.items.map((review) => {
                const look = STATUS_LOOKS[review.status];
                return (
                  <TableRow key={review.id}>
                    <TableCell className="max-w-md">
                      <div className="flex items-center gap-2">
                        <Stars rating={review.rating} />
                        <span className="truncate text-xs text-muted-foreground">
                          {review.user.name}
                          {review.isVerifiedPurchase && (
                            <BadgeCheckIcon className="ml-1 inline size-3.5 text-brand" />
                          )}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-1 line-clamp-2 text-sm">
                          {review.comment}
                        </p>
                      )}
                      {review.adminReply && (
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          ↳ {review.adminReply}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/products/${review.product.slug}`}
                        target="_blank"
                        className="block max-w-40 truncate text-sm hover:underline"
                      >
                        {review.product.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={look.className}>
                        {look.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Actions for ${review.user.name}'s review`}
                            />
                          }
                        >
                          <EllipsisIcon className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {review.status !== "APPROVED" && (
                            <DropdownMenuItem
                              disabled={busyId !== null}
                              onClick={() => void moderate(review, "APPROVED")}
                            >
                              <CheckIcon className="size-4" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {review.status !== "REJECTED" && (
                            <DropdownMenuItem
                              disabled={busyId !== null}
                              onClick={() => void moderate(review, "REJECTED")}
                            >
                              <XIcon className="size-4" />
                              Reject
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            disabled={busyId !== null}
                            onClick={() => {
                              setActionError(null);
                              setReplyFor(review);
                            }}
                          >
                            <MessageSquareReplyIcon className="size-4" />
                            {review.adminReply ? "Edit reply" : "Reply"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive data-highlighted:bg-destructive data-highlighted:text-white"
                            disabled={busyId !== null}
                            onClick={() => {
                              setActionError(null);
                              setToDelete(review);
                            }}
                          >
                            <Trash2Icon className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            {meta.total} {meta.total === 1 ? "review" : "reviews"}
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

      {replyFor && (
        <ReplyDialog
          review={replyFor}
          onClose={() => setReplyFor(null)}
          onSaved={() => {
            setReplyFor(null);
            refresh();
          }}
        />
      )}

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open && busyId === null) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete review?</AlertDialogTitle>
          <AlertDialogDescription>
            {toDelete &&
              `${toDelete.user.name}'s ${toDelete.rating}-star review of "${toDelete.product.name}" is removed permanently and the product's rating recalculates.`}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" disabled={busyId !== null} />}
            >
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              disabled={busyId !== null}
              onClick={() => void confirmDelete()}
            >
              {busyId !== null ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ReplyDialog({
  review,
  onClose,
  onSaved,
}: {
  review: AdminReview;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [reply, setReply] = React.useState(review.adminReply ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function save() {
    if (!reply.trim()) {
      setError("Write the reply first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await replyToReview(review.id, reply.trim());
      onSaved();
    } catch (err) {
      setError(messageOf(err, "Could not save the reply."));
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
        <DialogTitle>Reply as the store</DialogTitle>
        <DialogDescription>
          Shown under {review.user.name}&apos;s review on the product page
          (once the review is published).
        </DialogDescription>

        {error && <FormAlert>{error}</FormAlert>}

        {review.comment && (
          <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
            “{review.comment}”
          </p>
        )}

        <Textarea
          aria-label="Store reply"
          placeholder="Thanks for the review — …"
          className="min-h-24"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />

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
            {busy ? "Saving…" : "Save reply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
