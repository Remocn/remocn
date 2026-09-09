"use client";

import { animate, motion, useMotionValue } from "motion/react";
import { type ReactNode, useEffect, useRef } from "react";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";

const HEADER_HEIGHT = 64;
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
    let zoom: HTMLElement | null = null;
    let run = 0;

    const evaluate = () => {
      const height = headerRef.current?.offsetHeight ?? HEADER_HEIGHT;
      if (!zoom?.isConnected) {
        zoom = document.querySelector<HTMLElement>("[data-hero-zoom]");
      }

      if (!zoom) {
        y.set(0);
        prevPast.current = null;
        return;
      }

      const past = zoom.getBoundingClientRect().bottom <= window.innerHeight;
      const first = prevPast.current === null;

      if (!first && past !== prevPast.current) {
        animating.current = true;
        const id = ++run;
        const settle = () => {
          if (id !== run) return;
          animating.current = false;
          schedule();
        };
        animate(y, past ? 0 : -height, REVEAL_SPRING).then(settle, settle);
      } else if (past) {
        if (first) y.set(0);
      } else if (!animating.current) {
        y.set(-Math.min(window.scrollY, height));
      }

      prevPast.current = past;
    };

    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        evaluate();
      });
    };

    evaluate();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [y]);

  return (
    <>
      <motion.header
        ref={headerRef}
        style={{ y }}
        className="fixed inset-x-0 top-0 z-40"
      >
        <div
          className={cn(
            "transition-[height,background-color,box-shadow] duration-300",
            scrolled
              ? "h-14 bg-background [box-shadow:var(--elevation-raised)]"
              : "h-16 bg-transparent shadow-none",
          )}
        >
          <div className="section flex h-full items-center justify-between">
            {children}
          </div>
        </div>
      </motion.header>
      <div aria-hidden className="h-16" />
    </>
  );
}
