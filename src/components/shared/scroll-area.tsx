"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const IDLE_MS = 1000;
const THROTTLE_MS = 100;

type ScrollAreaProps = React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "aside";
};

/**
 * Scroll container with an overlay scrollbar (see the `scroll-area` utility in
 * globals.css). CSS reveals the thumb on hover; this component only marks the
 * container idle after the pointer stops moving so the thumb fades back out.
 * State lives in a DOM attribute — no React re-renders, no global listeners.
 */
export function ScrollArea({
  as: Tag = "div",
  className,
  ...props
}: ScrollAreaProps) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timer: number | undefined;
    let last = 0;

    const wake = () => {
      const now = performance.now();
      if (now - last < THROTTLE_MS) return;
      last = now;
      el.removeAttribute("data-sb-idle");
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => el.setAttribute("data-sb-idle", ""),
        IDLE_MS
      );
    };

    const reset = () => {
      window.clearTimeout(timer);
      el.removeAttribute("data-sb-idle");
    };

    el.addEventListener("pointermove", wake, { passive: true });
    el.addEventListener("scroll", wake, { passive: true });
    el.addEventListener("pointerleave", reset);
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener("pointermove", wake);
      el.removeEventListener("scroll", wake);
      el.removeEventListener("pointerleave", reset);
    };
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={cn("scroll-area", className)}
      {...props}
    />
  );
}
