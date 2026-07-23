"use client";

import * as React from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "motion/react";

import { cn } from "@/lib/utils";
import { CrownMark } from "@/components/shared/crown-mark";

/** One tile changes per beat, so each image stays visible for two beats. */
const BEAT_MS = 4500;
const IMG_SIZES = "(min-width: 768px) 22vw, 45vw";

/** Long, gentle push so slides drift rather than whip. */
const PUSH_EASE = [0.45, 0, 0.2, 1] as const;

export interface ShowcaseSlide {
  src: string;
  alt: string;
}

interface RotationState {
  /** Slide index shown in [left, right] tile. */
  shown: [number, number];
  /** Which tile swaps on the next beat. */
  turn: 0 | 1;
  /** Next slide index to inject. */
  next: number;
}

/**
 * Editorial offset collage (left tile lower, right tile higher) that rotates
 * through any number of slides, one tile at a time. Animations run on
 * Motion's compositor-friendly transform/opacity pipeline: slides push in
 * from the right while the outgoing one drifts left, a slow Ken Burns zoom
 * runs for each slide's lifetime, and only the visible slide (plus the
 * upcoming one, preloaded invisibly) stays mounted. Auto-play pauses on
 * hover, off-screen, and under prefers-reduced-motion.
 */
export function HeroShowcase({
  slides,
  className,
}: {
  slides: ShowcaseSlide[];
  className?: string;
}) {
  const count = slides.length;
  const [{ shown, turn, next }, setState] = React.useState<RotationState>({
    shown: [0, count > 1 ? 1 : 0],
    turn: 0,
    next: count > 2 ? 2 : 0,
  });
  const [paused, setPaused] = React.useState(false);
  const reduceMotion = useReducedMotion();
  const stageRef = React.useRef<HTMLDivElement>(null);
  const inView = useInView(stageRef, { amount: 0.3 });
  const autoPlay = count > 1 && !reduceMotion && inView && !paused;

  React.useEffect(() => {
    if (!autoPlay) return;
    const id = setTimeout(() => {
      setState((s) => {
        if (count === 2) {
          return { ...s, shown: [s.shown[1], s.shown[0]] };
        }
        const shownNext: [number, number] = [...s.shown];
        shownNext[s.turn] = s.next;
        return {
          shown: shownNext,
          turn: s.turn === 0 ? 1 : 0,
          next: (s.next + 1) % count,
        };
      });
    }, BEAT_MS);
    return () => clearTimeout(id);
  }, [shown, autoPlay, count]);

  if (count === 0) return null;

  const tiles = count === 1 ? [0] : [0, 1];

  const collageVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.16, delayChildren: 0.1 } },
  };
  const tileVariants: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 44 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
    },
  };
  const pillVariants: Variants = {
    hidden: {
      opacity: 0,
      y: reduceMotion ? 0 : 14,
      scale: reduceMotion ? 1 : 0.9,
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 260, damping: 20, delay: 0.6 },
    },
  };

  return (
    <div className={className}>
      <motion.div
        ref={stageRef}
        className="relative"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        variants={collageVariants}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-12 -z-10"
          style={{
            background:
              "radial-gradient(55% 50% at 50% 42%, oklch(0.52 0.1 60 / 0.28), transparent 72%)",
          }}
        />

        <div
          className={cn(
            "grid gap-4",
            count === 1 ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {tiles.map((tile) => {
            const visible = shown[tile];
            const slide = slides[visible];
            return (
              <motion.div
                key={tile}
                variants={tileVariants}
                whileHover={reduceMotion ? undefined : { y: -4 }}
                className={cn(tile === 0 && count > 1 && "translate-y-8")}
              >
                <motion.div
                  animate={
                    reduceMotion
                      ? undefined
                      : { y: tile === 0 ? [0, -8, 0] : [0, 8, 0] }
                  }
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative isolate aspect-3/4 overflow-hidden rounded-2xl rounded-tr-[2.5rem] shadow-2xl ring-1 ring-[oklch(0.72_0.09_70/0.4)] md:rounded-tr-[4rem]"
                >
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={visible}
                      className="absolute inset-0"
                      initial={{ x: reduceMotion ? 0 : "62%", opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: reduceMotion ? 0 : "-26%", opacity: 0 }}
                      transition={{
                        duration: reduceMotion ? 0.35 : 1.15,
                        ease: PUSH_EASE,
                      }}
                    >
                      <motion.div
                        className="absolute inset-0"
                        initial={{ scale: 1 }}
                        animate={{ scale: reduceMotion ? 1 : 1.08 }}
                        transition={{
                          duration: (BEAT_MS * 2) / 1000,
                          ease: "linear",
                        }}
                      >
                        <Image
                          src={slide.src}
                          alt={slide.alt}
                          fill
                          priority
                          sizes={IMG_SIZES}
                          className="object-cover"
                        />
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Warm light spilling in from the top-right corner. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-10 mix-blend-screen"
                    style={{
                      background:
                        "radial-gradient(65% 50% at 97% 3%, oklch(0.8 0.12 75 / 0.5), oklch(0.65 0.1 65 / 0.16) 45%, transparent 72%)",
                    }}
                  />

                  {/* Warm the browser cache for the incoming slide so it never
                      pops in half-loaded mid-animation. */}
                  {count > 2 && tile === turn && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -z-10 opacity-0"
                    >
                      <Image
                        src={slides[next].src}
                        alt=""
                        fill
                        sizes={IMG_SIZES}
                        className="object-cover"
                      />
                    </div>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          variants={pillVariants}
          className="absolute -bottom-4 left-1/2 z-10 -translate-x-1/2"
        >
          <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur">
            <CrownMark className="h-4 w-auto shrink-0" />
            <p className="text-sm font-medium whitespace-nowrap">
              Fresh winter drop · limited run
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
