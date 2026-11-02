"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** `keyboard`: opened by focus, so it appears and swaps without motion. */
export type TipState = {
  label: string;
  left: number;
  top: number;
  keyboard?: boolean;
};

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const INSTANT = { duration: 0 };

export function SwitcherTip({
  tip,
  onDismiss,
}: {
  tip: TipState | null;
  onDismiss: () => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const open = tip !== null;
  const instant = tip?.keyboard ?? false;
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", onDismiss, {
      capture: true,
      passive: true,
    });
    return () =>
      window.removeEventListener("scroll", onDismiss, { capture: true });
  }, [open, onDismiss]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {tip && (
        <motion.div
          aria-hidden="true"
          // Full transform strings run off the main thread, which the docs
          // player keeps busy.
          initial={{
            opacity: 0,
            transform: reduced ? "translateX(0px)" : "translateX(-6px)",
          }}
          animate={{ opacity: 1, transform: "translateX(0px)" }}
          exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }}
          transition={instant ? INSTANT : { duration: 0.18, ease: EASE_OUT }}
          style={{ left: tip.left, top: tip.top }}
          className="pointer-events-none fixed z-50 -translate-y-1/2"
        >
          <motion.div
            layout={!reduced}
            transition={{
              layout: instant ? INSTANT : { duration: 0.2, ease: EASE_OUT },
            }}
            style={{ borderRadius: 10 }}
            className="flex h-[34px] items-center overflow-hidden border border-divider bg-surface px-3.5 text-small whitespace-nowrap text-foreground shadow-[0_1px_2px_#0E10120F]"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={tip.label}
                layout={reduced ? false : "position"}
                initial={
                  reduced
                    ? { opacity: 0 }
                    : { opacity: 0, y: 6, filter: "blur(2px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  reduced
                    ? { opacity: 0 }
                    : { opacity: 0, y: -6, filter: "blur(2px)" }
                }
                transition={
                  instant ? INSTANT : { duration: 0.16, ease: EASE_OUT }
                }
              >
                {tip.label}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
