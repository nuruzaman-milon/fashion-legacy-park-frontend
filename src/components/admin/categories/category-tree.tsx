"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRightIcon,
  EllipsisIcon,
  HomeIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
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
import {
  deleteCategory,
  getAdminCategories,
} from "@/lib/api/admin/categories";
import { ApiError } from "@/lib/api/client";
import type { AdminCategory } from "@/types/admin";
import { cn } from "@/lib/utils";

interface TreeNode extends AdminCategory {
  children: TreeNode[];
  /** Own products + everything under it — products attach to leaves. */
  totalProducts: number;
}

function buildTree(flat: AdminCategory[]): TreeNode[] {
  const byId = new Map<string, TreeNode>(
    flat.map((c) => [c.id, { ...c, children: [], totalProducts: 0 }]),
  );
  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const bySort = (a: TreeNode, b: TreeNode) => a.sortOrder - b.sortOrder;
  const sum = (node: TreeNode): number => {
    node.children.sort(bySort);
    node.totalProducts =
      node._count.products + node.children.reduce((n, c) => n + sum(c), 0);
    return node.totalProducts;
  };
  roots.sort(bySort);
  for (const root of roots) sum(root);
  return roots;
}

type View = "all" | "home" | "active" | "hidden";

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "home", label: "On homepage" },
  { value: "active", label: "Active" },
  { value: "hidden", label: "Hidden" },
];

function TreeSkeleton() {
  return (
    <div className="flex flex-col gap-1 py-1">
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} className="flex items-center gap-2 py-2">
          <Skeleton className="size-5" />
          <Skeleton className="size-8 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-14 rounded-4xl" />
        </div>
      ))}
    </div>
  );
}

function Thumb({ category }: { category: AdminCategory }) {
  return category.image ? (
    <Image
      src={category.image}
      alt=""
      width={32}
      height={32}
      className="size-8 shrink-0 rounded-md object-cover"
    />
  ) : (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
      {category.name[0]}
    </span>
  );
}

function HomeBadge({ category }: { category: AdminCategory }) {
  if (!category.showOnHome) return null;
  return (
    <Badge variant="secondary" className="gap-1">
      <HomeIcon />#{category.homeSortOrder + 1}
    </Badge>
  );
}

function StatusBadge({ category }: { category: AdminCategory }) {
  return category.isActive ? (
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
  );
}

function RowActions({
  category,
  depth,
  onDelete,
}: {
  category: AdminCategory;
  depth: number;
  onDelete: (category: AdminCategory) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${category.name}`}
          />
        }
      >
        <EllipsisIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLinkItem
          render={<Link href={`/admin/categories/${category.id}/edit`} />}
        >
          <PencilIcon className="size-4" />
          Edit
        </DropdownMenuLinkItem>
        {depth < 2 && (
          <DropdownMenuLinkItem
            render={<Link href={`/admin/categories/new?parent=${category.id}`} />}
          >
            <PlusIcon className="size-4" />
            Add subcategory
          </DropdownMenuLinkItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive data-highlighted:bg-destructive data-highlighted:text-white"
          onClick={() => onDelete(category)}
        >
          <Trash2Icon className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Category list — an expandable tree by default; searching or picking a view
 * switches to a flat list with ancestor paths, because matches can sit under
 * collapsed (or filtered-out) parents. "On homepage" mirrors the tile order
 * of the storefront's Shop-by-category section.
 */
export function CategoryTree() {
  const [items, setItems] = React.useState<AdminCategory[] | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState("");
  const [view, setView] = React.useState<View>("all");
  const [toDelete, setToDelete] = React.useState<AdminCategory | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    getAdminCategories()
      .then((list) => {
        setItems(list);
        // Roots start expanded so the tree reads at a glance.
        setExpanded(new Set(list.filter((c) => !c.parentId).map((c) => c.id)));
      })
      .catch((err) => {
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "Could not load categories. Please try again.",
        );
      });
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const tree = React.useMemo(() => buildTree(items ?? []), [items]);

  // Per-id lookups the flat view needs: subtree product totals, depth, and
  // the ancestor path ("Women › Clothing").
  const meta = React.useMemo(() => {
    const totals = new Map<string, number>();
    const walkTotals = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        totals.set(node.id, node.totalProducts);
        walkTotals(node.children);
      }
    };
    walkTotals(tree);

    const byId = new Map((items ?? []).map((c) => [c.id, c]));
    const depths = new Map<string, number>();
    const paths = new Map<string, string>();
    for (const c of items ?? []) {
      const parts: string[] = [];
      let cursor = c;
      while (cursor.parentId) {
        const parent = byId.get(cursor.parentId);
        if (!parent) break;
        parts.unshift(parent.name);
        cursor = parent;
      }
      depths.set(c.id, parts.length);
      paths.set(c.id, parts.join(" › "));
    }
    return { totals, depths, paths };
  }, [tree, items]);

  const query = search.trim().toLowerCase();
  const flatMode = view !== "all" || query !== "";

  const filtered = React.useMemo(() => {
    if (!flatMode || !items) return [];
    const matches = items.filter((c) => {
      if (view === "home" && !c.showOnHome) return false;
      if (view === "active" && !c.isActive) return false;
      if (view === "hidden" && c.isActive) return false;
      if (
        query &&
        !c.name.toLowerCase().includes(query) &&
        !c.slug.includes(query)
      )
        return false;
      return true;
    });
    // Homepage view mirrors the storefront tile order; the rest read best
    // grouped by their place in the tree.
    return matches.sort((a, b) =>
      view === "home"
        ? a.homeSortOrder - b.homeSortOrder
        : `${meta.paths.get(a.id)} ${a.name}`.localeCompare(
            `${meta.paths.get(b.id)} ${b.name}`,
          ),
    );
  }, [flatMode, items, view, query, meta.paths]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const requestDelete = (category: AdminCategory) => {
    setDeleteError(null);
    setToDelete(category);
  };

  if (loadError) {
    return (
      <div className="space-y-3 py-2">
        <FormAlert>{loadError}</FormAlert>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setLoadError(null);
            load();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  if (items === null) return <TreeSkeleton />;

  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No categories yet — create the first one.
      </p>
    );
  }

  const treeRows: { node: TreeNode; depth: number }[] = [];
  if (!flatMode) {
    const walk = (nodes: TreeNode[], depth: number) => {
      for (const node of nodes) {
        treeRows.push({ node, depth });
        if (expanded.has(node.id)) walk(node.children, depth + 1);
      }
    };
    walk(tree, 0);
  }

  const blocked =
    toDelete !== null &&
    (toDelete._count.children > 0 || toDelete._count.products > 0);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteCategory(toDelete.id);
      setItems((prev) => prev?.filter((c) => c.id !== toDelete.id) ?? null);
      setToDelete(null);
    } catch (err) {
      // A 409 means the pre-check was stale (rows changed server-side).
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : "Could not delete the category. Please try again.",
      );
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search name or slug…"
            aria-label="Search categories"
            className="h-9 pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={view}
          items={VIEW_OPTIONS}
          onValueChange={(v) => setView(v ?? "all")}
        >
          <SelectTrigger aria-label="Filter categories" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VIEW_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {flatMode && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {items.length}
          </p>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Products</TableHead>
            <TableHead className="text-center">Homepage</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {!flatMode &&
            treeRows.map(({ node, depth }) => (
              <TableRow key={node.id}>
                <TableCell>
                  <div
                    className="flex items-center gap-2"
                    style={{ paddingLeft: `${depth * 1.75}rem` }}
                  >
                    {node.children.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggle(node.id)}
                        aria-label={
                          expanded.has(node.id)
                            ? `Collapse ${node.name}`
                            : `Expand ${node.name}`
                        }
                        aria-expanded={expanded.has(node.id)}
                        className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <ChevronRightIcon
                          className={cn(
                            "size-4 transition-transform",
                            expanded.has(node.id) && "rotate-90",
                          )}
                        />
                      </button>
                    ) : (
                      <span className="size-5 shrink-0" />
                    )}
                    <Thumb category={node} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{node.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        /{node.slug}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {node.totalProducts}
                </TableCell>
                <TableCell className="text-center">
                  <HomeBadge category={node} />
                </TableCell>
                <TableCell>
                  <StatusBadge category={node} />
                </TableCell>
                <TableCell>
                  <RowActions
                    category={node}
                    depth={depth}
                    onDelete={requestDelete}
                  />
                </TableCell>
              </TableRow>
            ))}

          {flatMode && filtered.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={5}
                className="py-10 text-center text-muted-foreground"
              >
                No categories match.
              </TableCell>
            </TableRow>
          )}
          {flatMode &&
            filtered.map((category) => {
              const path = meta.paths.get(category.id);
              return (
                <TableRow key={category.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Thumb category={category} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{category.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {path ? `${path} · ` : ""}/{category.slug}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {meta.totals.get(category.id) ?? category._count.products}
                  </TableCell>
                  <TableCell className="text-center">
                    <HomeBadge category={category} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge category={category} />
                  </TableCell>
                  <TableCell>
                    <RowActions
                      category={category}
                      depth={meta.depths.get(category.id) ?? 0}
                      onDelete={requestDelete}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteBusy) setToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            {blocked ? "Can't delete this category" : "Delete category?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {blocked
              ? `"${toDelete?.name}" still has ${
                  toDelete && toDelete._count.children > 0
                    ? `${toDelete._count.children} subcategories`
                    : `${toDelete?._count.products} products`
                }. Move or delete those first.`
              : `"${toDelete?.name}" will be removed permanently.`}
          </AlertDialogDescription>
          {deleteError && <FormAlert>{deleteError}</FormAlert>}
          <AlertDialogFooter>
            <AlertDialogClose
              render={<Button variant="outline" disabled={deleteBusy} />}
            >
              {blocked ? "Close" : "Cancel"}
            </AlertDialogClose>
            {!blocked && (
              <Button
                variant="destructive"
                disabled={deleteBusy}
                onClick={() => void confirmDelete()}
              >
                {deleteBusy ? "Deleting…" : "Delete"}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
