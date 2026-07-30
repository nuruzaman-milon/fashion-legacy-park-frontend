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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminCategory } from "@/types/admin";
import { cn } from "@/lib/utils";

interface TreeNode extends AdminCategory {
  children: TreeNode[];
}

function buildTree(flat: AdminCategory[]): TreeNode[] {
  const byId = new Map<string, TreeNode>(
    flat.map((c) => [c.id, { ...c, children: [] }]),
  );
  const roots: TreeNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const bySort = (a: TreeNode, b: TreeNode) => a.sortOrder - b.sortOrder;
  for (const node of byId.values()) node.children.sort(bySort);
  return roots.sort(bySort);
}

/**
 * Category list as an expandable tree — the flat rows come in API shape and
 * the tree is rebuilt from `parentId`, exactly how the live endpoint will
 * feed it. Deletes mirror the backend rule (409 while children or products
 * exist) but only mutate local state until the API is wired.
 */
export function CategoryTree({ categories }: { categories: AdminCategory[] }) {
  const [items, setItems] = React.useState(categories);
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(categories.filter((c) => !c.parentId).map((c) => c.id)),
  );
  const [toDelete, setToDelete] = React.useState<AdminCategory | null>(null);

  const tree = React.useMemo(() => buildTree(items), [items]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const rows: { node: TreeNode; depth: number }[] = [];
  const walk = (nodes: TreeNode[], depth: number) => {
    for (const node of nodes) {
      rows.push({ node, depth });
      if (expanded.has(node.id)) walk(node.children, depth + 1);
    }
  };
  walk(tree, 0);

  const blocked =
    toDelete !== null &&
    (toDelete._count.children > 0 || toDelete._count.products > 0);

  return (
    <>
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
          {rows.map(({ node, depth }) => (
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
                  {node.image ? (
                    <Image
                      src={node.image}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                      {node.name[0]}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium">{node.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      /{node.slug}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {node._count.products}
              </TableCell>
              <TableCell className="text-center">
                {node.showOnHome && (
                  <Badge variant="secondary" className="gap-1">
                    <HomeIcon />
                    #{node.homeSortOrder + 1}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {node.isActive ? (
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
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${node.name}`}
                      />
                    }
                  >
                    <EllipsisIcon className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLinkItem
                      render={
                        <Link href={`/admin/categories/${node.id}/edit`} />
                      }
                    >
                      <PencilIcon className="size-4" />
                      Edit
                    </DropdownMenuLinkItem>
                    {depth < 2 && (
                      <DropdownMenuLinkItem
                        render={
                          <Link
                            href={`/admin/categories/new?parent=${node.id}`}
                          />
                        }
                      >
                        <PlusIcon className="size-4" />
                        Add subcategory
                      </DropdownMenuLinkItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive data-highlighted:bg-destructive data-highlighted:text-white"
                      onClick={() => setToDelete(node)}
                    >
                      <Trash2Icon className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
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
                }. Move or delete those first — the API refuses otherwise.`
              : `"${toDelete?.name}" will be removed permanently. This is a design preview — nothing is sent to the server yet.`}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>
              {blocked ? "Close" : "Cancel"}
            </AlertDialogClose>
            {!blocked && (
              <Button
                variant="destructive"
                onClick={() => {
                  const id = toDelete?.id;
                  setToDelete(null);
                  if (id) setItems((prev) => prev.filter((c) => c.id !== id));
                }}
              >
                Delete
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
