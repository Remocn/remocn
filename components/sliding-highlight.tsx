"use client";

import { motion, type Transition } from "motion/react";
import { cn } from "@/lib/utils";

const DEFAULT_TRANSITION: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.6,
};

/**
 * Absolutely-positioned pill that springs to a target rect. Driven by transform
 * (left:0 + translateX) rather than animating layout, so it slides between
 * targets instead of popping. `rect={null}` retracts it (opacity 0). The parent
 * owns positioning context and measurement; this only renders the moving span.
 */
export function SlidingHighlight({
  rect,
  className,
  transition = DEFAULT_TRANSITION,
}: {
  rect: { left: number; width: number } | null;
  className?: string;
  transition?: Transition;
}) {
  return (
    <motion.span
      aria-hidden
      initial={false}
      className={cn(
        "pointer-events-none absolute left-0 top-0 -z-10 h-full rounded-full bg-muted",
        className,
      )}
      animate={{
        x: rect?.left ?? 0,
        width: rect?.width ?? 0,
        opacity: rect ? 1 : 0,
      }}
      transition={transition}
    />
  );
}
