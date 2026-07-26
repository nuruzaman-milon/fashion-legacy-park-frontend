"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GOLD = "oklch(0.8 0.1 70)";

interface CarouselProps {
  children: React.ReactNode;
  /** Width (and any extra) classes for each item's <li> wrapper. */
  itemClassName?: string;
  trackClassName?: string;
  controlsClassName?: string;
  /** "dark" adapts arrows/dots for dark section backgrounds. */
  variant?: "light" | "dark";
}

/**
 * Shared scroll-snap carousel: native touch swipe, mouse drag (snap is
 * suspended while dragging, then the track glides to the nearest item and
 * snap is restored), plus arrow + dot controls rendered below the track.
 * Pages are derived from real item offsets, so dots, arrows and snap
 * positions always agree, at every viewport size.
 */
export function Carousel({
  children,
  itemClassName,
  trackClassName,
  controlsClassName,
  variant = "light",
}: CarouselProps) {
  const items = React.Children.toArray(children);

  const trackRef = React.useRef<HTMLUListElement | null>(null);
  const pageStartsRef = React.useRef<number[]>([0]);
  const dragRef = React.useRef({
    pointerId: -1,
    startX: 0,
    startScroll: 0,
    moved: false,
  });
  const settleTimer = React.useRef<number | null>(null);

  const [pages, setPages] = React.useState(1);
  const [page, setPage] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);

  /** Recompute page start offsets from item positions and the active page. */
  const measure = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const listItems = Array.from(track.children) as HTMLElement[];
    if (listItems.length === 0) return;

    const base = listItems[0].offsetLeft;
    const view = track.clientWidth;
    const maxScroll = Math.max(0, track.scrollWidth - view);

    const starts: number[] = [0];
    let pageStart = 0;
    for (const item of listItems) {
      const left = item.offsetLeft - base;
      if (left + item.offsetWidth > pageStart + view + 1) {
        pageStart = Math.min(left, maxScroll);
        if (pageStart > starts[starts.length - 1]) starts.push(pageStart);
      }
    }

    pageStartsRef.current = starts;
    setPages(starts.length);
    const pos = track.scrollLeft;
    let active = 0;
    for (let i = 1; i < starts.length; i++) {
      if (Math.abs(starts[i] - pos) < Math.abs(starts[active] - pos)) {
        active = i;
      }
    }
    setPage(active);
  }, []);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => {
      observer.disconnect();
      if (settleTimer.current !== null) clearTimeout(settleTimer.current);
    };
  }, [measure]);

  const scrollToPage = (target: number) => {
    const track = trackRef.current;
    const starts = pageStartsRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(starts.length - 1, target));
    track.scrollTo({ left: starts[clamped], behavior: "smooth" });
  };

  /* --- mouse drag-to-scroll (touch uses native scrolling) --- */

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    if (settleTimer.current !== null) clearTimeout(settleTimer.current);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: track.scrollLeft,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (drag.pointerId !== e.pointerId) return;
    const track = trackRef.current;
    if (!track) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved) {
      if (Math.abs(dx) <= 6) return;
      // A real drag starts here. Capture the pointer only now — capturing on
      // pointerdown would retarget the eventual click event to the track,
      // silently swallowing every link click inside the carousel. Snapping is
      // suspended inline as well: the class swap from setDragging lands a
      // frame later, and active snap-mandatory would undo the first writes.
      drag.moved = true;
      track.style.scrollSnapType = "none";
      setDragging(true);
      track.setPointerCapture(e.pointerId);
    }
    track.scrollLeft = drag.startScroll - dx;
  };

  const endDrag = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (drag.pointerId !== e.pointerId) return;
    drag.pointerId = -1;
    // Plain click, never dragged — nothing to glide or settle.
    if (!drag.moved) return;

    const track = trackRef.current;
    if (track) {
      // glide to the nearest item boundary, then restore snapping
      const listItems = Array.from(track.children) as HTMLElement[];
      const base = listItems[0]?.offsetLeft ?? 0;
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      const pos = track.scrollLeft;
      let nearest = 0;
      let bestDistance = Infinity;
      for (const item of listItems) {
        const left = Math.min(item.offsetLeft - base, maxScroll);
        const distance = Math.abs(left - pos);
        if (distance < bestDistance) {
          bestDistance = distance;
          nearest = left;
        }
      }
      track.scrollTo({ left: nearest, behavior: "smooth" });
    }
    settleTimer.current = window.setTimeout(() => {
      const t = trackRef.current;
      if (t) t.style.scrollSnapType = "";
      setDragging(false);
    }, 420);
  };

  /** A real drag should not trigger the link it ended on. */
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragRef.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.moved = false;
    }
  };

  return (
    <>
      <ul
        ref={trackRef}
        onScroll={measure}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
        className={cn(
          // -m/p pairs give hover-scaled cards room inside the scroll clip
          // without shifting the visible layout.
          "-mx-1.5 -my-2 flex gap-4 overflow-x-auto px-1.5 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          dragging
            ? "cursor-grabbing snap-none select-none"
            : "cursor-grab snap-x snap-mandatory",
          trackClassName
        )}
      >
        {items.map((child, i) => (
          <li key={i} className={cn("shrink-0 snap-start", itemClassName)}>
            {child}
          </li>
        ))}
      </ul>

      {pages > 1 && (
        <div
          className={cn(
            "mt-6 flex items-center justify-center gap-4",
            controlsClassName
          )}
        >
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous items"
            disabled={page === 0}
            onClick={() => scrollToPage(page - 1)}
            className={cn(
              "rounded-full",
              variant === "dark" &&
                "border-white/25 bg-transparent text-background hover:bg-white/10 hover:text-background dark:border-white/25 dark:bg-transparent dark:hover:bg-white/10"
            )}
          >
            <ChevronLeftIcon />
          </Button>
          <div className="flex gap-2">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToPage(i)}
                aria-label={`Go to page ${i + 1}`}
                aria-current={i === page}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === page
                    ? cn("w-7", variant === "light" && "bg-brand")
                    : cn(
                        "w-2",
                        variant === "dark"
                          ? "bg-white/25 hover:bg-white/50"
                          : "bg-foreground/20 hover:bg-foreground/40"
                      )
                )}
                style={
                  i === page && variant === "dark"
                    ? { background: GOLD }
                    : undefined
                }
              />
            ))}
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next items"
            disabled={page >= pages - 1}
            onClick={() => scrollToPage(page + 1)}
            className={cn(
              "rounded-full",
              variant === "dark" &&
                "border-white/25 bg-transparent text-background hover:bg-white/10 hover:text-background dark:border-white/25 dark:bg-transparent dark:hover:bg-white/10"
            )}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      )}
    </>
  );
}
