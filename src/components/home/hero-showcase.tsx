"use client";

import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/** One tile changes per beat, so each image stays visible for two beats. */
const BEAT_MS = 4500;
const GOLD = "oklch(0.8 0.1 70)";

/**
 * Shared classes for the enter/exit movement: a long, gentle ease-in-out so
 * slides drift rather than whip.
 */
const SLIDE_EASE =
  "duration-[1400ms] ease-[cubic-bezier(0.45,0,0.2,1)] motion-reduce:transition-none";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_MOTION_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  );
}

export interface ShowcaseSlide {
  src: string;
  alt: string;
}

interface RotationState {
  /** Slide index shown in [left, right] tile. */
  shown: [number, number];
  /** What each tile showed before its last swap — drives the exit animation. */
  prev: [number, number];
  /** Which tile swaps on the next beat. */
  turn: 0 | 1;
  /** Next slide index to inject. */
  next: number;
}

/**
 * Editorial offset collage (left tile lower, right tile higher) that rotates
 * through any number of slides, one tile at a time. Swaps are a directional
 * push: the incoming image slides in from the right over the outgoing one,
 * which drifts left and dims — while its slow Ken Burns zoom keeps running so
 * nothing snaps mid-exit. Pauses on hover; auto-play is skipped under
 * prefers-reduced-motion (dots navigate manually).
 */
export function HeroShowcase({
  slides,
  className,
}: {
  slides: ShowcaseSlide[];
  className?: string;
}) {
  const count = slides.length;
  const initialShown: [number, number] = [0, count > 1 ? 1 : 0];
  const [{ shown, prev, turn }, setState] = React.useState<RotationState>({
    shown: initialShown,
    prev: initialShown,
    turn: 0,
    next: count > 2 ? 2 : 0,
  });
  const [paused, setPaused] = React.useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const autoPlay = count > 1 && !prefersReducedMotion;

  React.useEffect(() => {
    if (!autoPlay || paused) return;
    const id = setTimeout(() => {
      setState((s) => {
        if (count === 2) {
          return { ...s, prev: s.shown, shown: [s.shown[1], s.shown[0]] };
        }
        const shownNext: [number, number] = [...s.shown];
        shownNext[s.turn] = s.next;
        return {
          shown: shownNext,
          prev: s.shown,
          turn: s.turn === 0 ? 1 : 0,
          next: (s.next + 1) % count,
        };
      });
    }, BEAT_MS);
    return () => clearTimeout(id);
  }, [shown, turn, autoPlay, paused, count]);

  if (count === 0) return null;

  const jumpTo = (i: number) => {
    setState((s) => {
      if (s.shown.includes(i)) return s;
      const shownNext: [number, number] = [...s.shown];
      shownNext[s.turn] = i;
      return {
        shown: shownNext,
        prev: s.shown,
        turn: s.turn === 0 ? 1 : 0,
        next: (i + 1) % count,
      };
    });
  };

  const tiles = count === 1 ? [0] : [0, 1];

  return (
    <div className={className}>
      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className={cn(
            "grid gap-4",
            count === 1 ? "grid-cols-1" : "grid-cols-2"
          )}
        >
          {tiles.map((tile) => {
            const visible = shown[tile];
            const leaving = prev[tile] !== visible ? prev[tile] : null;
            return (
              <div
                key={tile}
                className={cn(
                  "relative isolate aspect-3/4 overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10",
                  tile === 0 && count > 1 && "translate-y-8"
                )}
              >
                {slides.map((slide, i) => {
                  const isVisible = i === visible;
                  const isLeaving = i === leaving;
                  return (
                    <div
                      key={slide.src}
                      aria-hidden={!isVisible}
                      className={cn(
                        "absolute inset-0",
                        isVisible &&
                          `z-20 translate-x-0 opacity-100 transition-[transform,opacity] ${SLIDE_EASE}`,
                        isLeaving &&
                          `z-10 -translate-x-1/4 opacity-0 transition-[transform,opacity] ${SLIDE_EASE}`,
                        !isVisible &&
                          !isLeaving &&
                          "z-0 translate-x-[55%] opacity-0"
                      )}
                    >
                      <Image
                        src={slide.src}
                        alt={slide.alt}
                        fill
                        priority={i === tile}
                        sizes="(min-width: 768px) 22vw, 45vw"
                        className={cn(
                          "object-cover motion-reduce:transition-none motion-reduce:transform-none",
                          isVisible || isLeaving
                            ? "scale-[1.07] transition-transform duration-[7000ms] ease-linear"
                            : "scale-100"
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="absolute -bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur">
          <span className="flex size-2 rounded-full bg-[oklch(0.8_0.1_70)]" />
          <p className="text-sm font-medium whitespace-nowrap">
            Fresh winter drop · limited run
          </p>
        </div>
      </div>

      {count > 2 && (
        <div className="mt-14 flex justify-center gap-2">
          {slides.map((slide, i) => {
            const isShown = shown.includes(i);
            return (
              <button
                key={slide.src}
                type="button"
                onClick={() => jumpTo(i)}
                aria-label={`Show ${slide.alt}`}
                aria-current={isShown}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  isShown ? "w-7" : "w-2 bg-white/25 hover:bg-white/50"
                )}
                style={isShown ? { background: GOLD } : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
