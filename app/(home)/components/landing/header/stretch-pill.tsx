"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MetalRing } from "../ui/metal-ring";

export type Rect = {
  left: number;
  width: number;
  top?: number;
  enter?: "fade" | "from-right";
  behind?: boolean;
  /** Ring the pill with the travelling `border-metal` (Sponsors). */
  metal?: boolean;
};

const LEAD_SPRING = {
  type: "spring",
  stiffness: 560,
  damping: 44,
  mass: 0.6,
} as const;
const TRAIL_SPRING = {
  type: "spring",
  stiffness: 170,
  damping: 19,
  mass: 0.9,
} as const;
const SWEEP_SPRING = {
  type: "spring",
  stiffness: 420,
  damping: 20,
  mass: 0.8,
  restDelta: 0.5,
} as const;

export function StretchPill({
  rect,
  className,
}: {
  rect: Rect | null;
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  const left = useMotionValue(0);
  const right = useMotionValue(0);
  const top = useMotionValue(rect?.top ?? 0);
  const width = useTransform(() => Math.max(right.get() - left.get(), 0));
  const shown = useRef(false);

  const targetLeft = rect?.left;
  const targetRight = rect ? rect.left + rect.width : undefined;
  const targetTop = rect?.top ?? 0;
  const enter = rect?.enter ?? "fade";
  useEffect(() => {
    if (targetLeft === undefined || targetRight === undefined) {
      shown.current = false;
      return;
    }
    if (!shown.current || reduced) {
      top.jump(targetTop);
      right.jump(targetRight);
      if (enter === "from-right" && !reduced) {
        left.jump(targetRight);
        animate(left, targetLeft, SWEEP_SPRING);
      } else {
        left.jump(targetLeft);
      }
      shown.current = true;
      return;
    }
    const movingRight = targetLeft > left.get();
    animate(left, targetLeft, movingRight ? TRAIL_SPRING : LEAD_SPRING);
    animate(right, targetRight, movingRight ? LEAD_SPRING : TRAIL_SPRING);
    animate(top, targetTop, LEAD_SPRING);
  }, [targetLeft, targetRight, targetTop, enter, reduced, left, right, top]);

  return (
    <motion.span
      aria-hidden="true"
      initial={false}
      style={{ x: left, y: top, width }}
      animate={{ opacity: rect && !rect.behind ? 1 : 0 }}
      transition={
        reduced
          ? { duration: 0 }
          : rect?.behind
            ? { duration: 0.1, delay: 0.24, ease: "linear" }
            : { duration: 0.16, ease: "easeOut" }
      }
      className={cn(
        "pointer-events-none absolute top-0 left-0 -z-10 h-(--hdr-item-h) rounded-(--hdr-item-r) bg-surface/55",
        className,
      )}
    >
      {/* The ring sits on the pill's edge (inset by its width, so it doesn't
          grow the pill). Paused while hidden so it doesn't tick for nothing. */}
      <motion.span
        initial={false}
        animate={{ opacity: rect?.metal ? 1 : 0 }}
        transition={
          reduced ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }
        }
        className="absolute inset-0.5 rounded-[calc(var(--hdr-item-r)-2px)]"
      >
        <MetalRing
          width={2}
          className={cn(!rect?.metal && "before:[animation-play-state:paused]")}
        />
      </motion.span>
    </motion.span>
  );
}
