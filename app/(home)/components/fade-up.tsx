"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";

const EASE_OUT_EXPO = [0.19, 1, 0.22, 1] as const;

// Transform strings so the entrance runs off the main thread.
const HIDDEN = {
  opacity: 0,
  transform: "translateY(24px)",
  filter: "blur(8px)",
};
const VISIBLE = {
  opacity: 1,
  transform: "translateY(0px)",
  filter: "blur(0px)",
};
const FADED = { opacity: 0 };
const SHOWN = { opacity: 1 };

export function FadeUp({
  children,
  delay = 0,
  className = "",
  gate,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  gate?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const reduced = useReducedMotion() ?? false;
  const [seen] = useState(
    () =>
      gate !== undefined &&
      typeof window !== "undefined" &&
      sessionStorage.getItem(gate) !== null,
  );
  useEffect(() => {
    if (gate !== undefined) sessionStorage.setItem(gate, "1");
  }, [gate]);
  // Reduced motion keeps the fade and drops the rise and blur.
  const [hidden, visible] = reduced ? [FADED, SHOWN] : [HIDDEN, VISIBLE];
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={hidden}
      animate={seen || inView ? visible : hidden}
      transition={
        seen
          ? { duration: 0 }
          : reduced
            ? { duration: 0.3, ease: "easeOut", delay }
            : { duration: 0.8, ease: EASE_OUT_EXPO, delay }
      }
    >
      {children}
    </motion.div>
  );
}
