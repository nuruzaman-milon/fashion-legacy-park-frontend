"use client";

import * as React from "react";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { StatTile } from "@/components/admin/stat-tile";
import { SellerStatusBadge } from "@/components/seller/seller-status";
import { FormAlert } from "@/components/auth/form-alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { sellerCatalogApi } from "@/lib/api/seller/products";
import { getSellerProfile, type SellerProfile } from "@/lib/api/seller/profile";
import type { ProductStatus } from "@/types/admin";

/** Tiles are meta.total of a limit-1 list call per status — no stats API yet. */
const TILES: { status: ProductStatus; label: string; hint?: string }[] = [
  { status: "ACTIVE", label: "Live products" },
  { status: "PENDING_APPROVAL", label: "In review" },
  { status: "DRAFT", label: "Drafts" },
  { status: "REJECTED", label: "Rejected", hint: "Fix and resubmit" },
];

/** What a non-approved shop needs to know before anything else. */
function StatusBanner({ profile }: { profile: SellerProfile }) {
  if (profile.status === "APPROVED") return null;
  if (profile.status === "PENDING") {
    return (
      <FormAlert tone="info">
        Your shop is awaiting approval. You can prepare products now — they
        appear on the storefront once the shop is approved.
      </FormAlert>
    );
  }
  return (
    <FormAlert>
      {profile.status === "SUSPENDED"
        ? "Your shop is suspended — your products are hidden from the storefront. Contact support to resolve this."
        : "Your shop application was rejected. Contact support for details."}
    </FormAlert>
  );
}

export function SellerOverview() {
  const [data, setData] = React.useState<{
    profile: SellerProfile;
    counts: number[];
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    return Promise.all([
      getSellerProfile(),
      ...TILES.map((tile) =>
        sellerCatalogApi.listProducts({ limit: 1, status: tile.status }),
      ),
    ])
      .then(([profile, ...lists]) => {
        setData({
          profile: profile as SellerProfile,
          counts: lists.map((list) => list.meta.total),
        });
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load your shop. Please try again.",
        );
      });
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  if (error) {
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

  if (data === null) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TILES.map((tile) => (
            <Skeleton key={tile.status} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { profile, counts } = data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={profile.shopName}
        description={`${profile.code} · Commission ${Number(profile.commissionRate)}%`}
      >
        <SellerStatusBadge status={profile.status} />
        <Button render={<Link href="/seller/products/new" />}>
          <PlusIcon data-icon="inline-start" />
          Add product
        </Button>
      </PageHeader>

      <StatusBanner profile={profile} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((tile, index) => (
          <StatTile
            key={tile.status}
            label={tile.label}
            value={String(counts[index])}
            hint={tile.hint}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Sales and earnings reports are on the roadmap — every delivered order
        is already recorded against your shop.
      </p>
    </div>
  );
}
