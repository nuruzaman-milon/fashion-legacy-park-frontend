"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EllipsisIcon,
  PencilIcon,
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
import { FormAlert } from "@/components/auth/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteBanner,
  getAdminBanners,
  reorderBanners,
  type AdminBanner,
} from "@/lib/api/admin/banners";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/**
 * Hero banners in storefront order — the homepage shows the first ACTIVE
 * one. The arrows persist the order through PATCH /admin/banners/reorder
 * (optimistically; a failure rolls the list back).
 */
export function BannerList() {
  const [banners, setBanners] = React.useState<AdminBanner[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<AdminBanner | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  const load = React.useCallback(() => {
    return getAdminBanners()
      .then(setBanners)
      .catch((err) => {
        setError(messageOf(err, "Could not load banners. Please try again."));
      });
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function move(index: number, delta: -1 | 1) {
    if (!banners) return;
    const target = index + delta;
    if (target < 0 || target >= banners.length) return;
    const next = [...banners];
    [next[index], next[target]] = [next[target], next[index]];
    setBanners(next);
    setBusy(true);
    setError(null);
    try {
      await reorderBanners(next.map((b, i) => ({ id: b.id, sortOrder: i })));
    } catch (err) {
      setBanners(banners);
      setError(messageOf(err, "Could not reorder. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleteBusy(true);
    setError(null);
    try {
      await deleteBanner(toDelete.id);
      setBanners((prev) => prev?.filter((b) => b.id !== toDelete.id) ?? null);
      setToDelete(null);
    } catch (err) {
      setError(messageOf(err, "Could not delete the banner."));
      setToDelete(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  if (error && banners === null) {
    return (
      <div className="space-y-3">
        <FormAlert>{error}</FormAlert>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setError(null);
            void load();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (banners === null) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 2 }, (_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-4">
              <Skeleton className="h-20 w-36 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-72" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {error && <FormAlert>{error}</FormAlert>}

      {banners.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No banners yet — the storefront shows its built-in hero until the
            first one is created.
          </CardContent>
        </Card>
      )}

      {banners.map((banner, index) => (
        <Card key={banner.id} className={cn(!banner.isActive && "opacity-70")}>
          <CardContent className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Move up"
                disabled={busy || index === 0}
                onClick={() => void move(index, -1)}
              >
                <ArrowUpIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Move down"
                disabled={busy || index === banners.length - 1}
                onClick={() => void move(index, 1)}
              >
                <ArrowDownIcon className="size-3.5" />
              </Button>
            </div>

            <Image
              src={banner.desktopImageUrl}
              alt={banner.imageAlt ?? ""}
              width={144}
              height={80}
              className="h-20 w-36 shrink-0 rounded-lg object-cover"
            />

            <div className="min-w-0 flex-1 basis-48">
              {banner.eyebrow && (
                <p className="text-xs tracking-wide text-brand uppercase">
                  {banner.eyebrow}
                </p>
              )}
              <p className="truncate font-heading text-base font-medium">
                {banner.title}
              </p>
              {banner.subtitle && (
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {banner.subtitle}
                </p>
              )}
              {banner.buttonText && (
                <p className="mt-1 text-xs text-muted-foreground">
                  “{banner.buttonText}” → {banner.buttonLink}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {index === 0 && banner.isActive && (
                <Badge variant="secondary">Showing on homepage</Badge>
              )}
              {banner.isActive ? (
                <Badge
                  variant="outline"
                  className="border-emerald-600/25 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400"
                >
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Hidden
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${banner.title}`}
                    />
                  }
                >
                  <EllipsisIcon className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLinkItem
                    render={<Link href={`/admin/banners/${banner.id}/edit`} />}
                  >
                    <PencilIcon className="size-4" />
                    Edit
                  </DropdownMenuLinkItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive data-highlighted:bg-destructive data-highlighted:text-white"
                    onClick={() => setToDelete(banner)}
                  >
                    <Trash2Icon className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteBusy) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete banner?</AlertDialogTitle>
          <AlertDialogDescription>
            “{toDelete?.title}” will be removed permanently. If it was the only
            active banner, the homepage falls back to the built-in hero.
          </AlertDialogDescription>
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
