"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";

const HEADER_HEIGHT = 88;
const REVEAL_SPRING = {
  type: "spring",
  stiffness: 480,
  damping: 34,
  mass: 0.9,
} as const;

export function StickyHeaderShell({ children }: { children: ReactNode }) {
  const scrolled = useScroll();
  const headerRef = useRef<HTMLElement>(null);
  const y = useMotionValue(0);
  const prevPast = useRef<boolean | null>(null);
  const animating = useRef(false);

  useEffect(() => {
    const evaluate = () => {
      const height = headerRef.current?.offsetHeight ?? HEADER_HEIGHT;
      const zoom = document.querySelector<HTMLElement>("[data-hero-zoom]");

      if (!zoom) {
        y.set(0);
        prevPast.current = true;
        return;
      }

      const past = zoom.getBoundingClientRect().bottom <= window.innerHeight;
      const first = prevPast.current === null;

      if (!first && past !== prevPast.current) {
        animating.current = true;
        animate(y, past ? 0 : -height, REVEAL_SPRING).then(() => {
          animating.current = false;
        });
      } else if (past) {
        if (first) y.set(0);
      } else if (!animating.current) {
        y.set(-Math.min(window.scrollY, height));
      }

      prevPast.current = past;
    };

    evaluate();
    window.addEventListener("scroll", evaluate, { passive: true });
    window.addEventListener("resize", evaluate);
    return () => {
      window.removeEventListener("scroll", evaluate);
      window.removeEventListener("resize", evaluate);
    };
  }, [y]);

  return (
    <>
      <motion.header
        ref={headerRef}
        style={{ y }}
        className="fixed inset-x-0 top-0 z-40 py-3"
      >
        <div className="section">
          <div
            className={cn(
              "flex w-full items-center justify-between rounded-3xl border px-4 transition-all duration-300 sm:px-6",
              scrolled
                ? "h-14 border-border bg-background/80 backdrop-blur-xl"
                : "h-16 border-transparent bg-transparent",
            )}
          >
            {children}
          </div>
        </div>
      </motion.header>
      <div aria-hidden className="h-[88px]" />
    </>
  );
}
