"use client";

import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminCategory } from "@/types/admin";

/** Sentinel for "stop here — attach to the level above". */
const HERE = "__here__";

const bySort = (a: AdminCategory, b: AdminCategory) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

/**
 * Level-by-level category picker: one small dropdown per tree depth instead
 * of one 80-option list. A product can attach at any level, so each deeper
 * select offers "<parent> itself" to stop the descent; `value` is always the
 * deepest id picked so far.
 */
export function CategoryCascade({
  categories,
  value,
  onChange,
}: {
  categories: AdminCategory[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  const byId = React.useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );
  const childrenOf = React.useCallback(
    (parentId: string | null) =>
      categories
        .filter((c) => c.parentId === parentId)
        .sort(bySort),
    [categories],
  );

  // The selected category's ancestor chain, root first.
  const chain = React.useMemo(() => {
    const nodes: AdminCategory[] = [];
    let cursor = value ? byId.get(value) : undefined;
    while (cursor) {
      nodes.unshift(cursor);
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
    return nodes;
  }, [value, byId]);

  const roots = childrenOf(null);

  const levels: {
    parent: AdminCategory;
    options: AdminCategory[];
    selected: string;
  }[] = [];
  for (let depth = 0; depth < chain.length; depth++) {
    const parent = chain[depth];
    const options = childrenOf(parent.id);
    if (options.length === 0) break;
    levels.push({
      parent,
      options,
      selected: chain[depth + 1]?.id ?? HERE,
    });
  }

  return (
    <div className="space-y-2">
      <Select
        value={chain[0]?.id ?? null}
        items={roots.map((c) => ({ value: c.id, label: c.name }))}
        onValueChange={(v) => {
          if (v) onChange(v);
        }}
      >
        <SelectTrigger aria-label="Top-level category" className="h-10 w-full">
          <SelectValue placeholder="Pick a category…" />
        </SelectTrigger>
        <SelectContent>
          {roots.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {levels.map(({ parent, options, selected }) => {
        const items = [
          { value: HERE, label: `${parent.name} itself` },
          ...options.map((c) => ({ value: c.id, label: c.name })),
        ];
        return (
          <Select
            key={parent.id}
            value={selected}
            items={items}
            onValueChange={(v) => {
              if (v) onChange(v === HERE ? parent.id : v);
            }}
          >
            <SelectTrigger
              aria-label={`Subcategory of ${parent.name}`}
              className="h-10 w-full"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}

      {chain.length > 1 && (
        <p className="text-xs text-muted-foreground">
          {chain.map((c) => c.name).join(" › ")}
        </p>
      )}
    </div>
  );
}
