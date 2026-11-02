"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Sponsor } from "@/config/sponsors";
import { cn } from "@/lib/utils";
import { CELL } from "./sponsor-cells";
import { SponsorLogo } from "./sponsor-logo";

const STEP_MS = 2400;
const WAVE_S = 0.125;
const EASE = [0.25, 0.46, 0.45, 0.94] as const;

// Transform strings, not `y`, so the swap runs off the main thread.
const SWAP = {
  initial: { opacity: 0, transform: "translateY(60%)", filter: "blur(2px)" },
  animate: { opacity: 1, transform: "translateY(0%)", filter: "blur(0px)" },
  exit: { opacity: 0, transform: "translateY(-50%)", filter: "blur(3px)" },
};

const FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

function dealColumns(sponsors: Sponsor[], count: number) {
  return Array.from({ length: count }, (_, column) =>
    sponsors.filter((_, index) => index % count === column),
  );
}

export function SponsorCarousel({
  sponsors,
  cellClassNames,
}: {
  sponsors: Sponsor[];
  cellClassNames: string[];
}) {
  const columns = dealColumns(sponsors, cellClassNames.length);
  const [step, setStep] = useState(0);
  const [held, setHeld] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const firstCell = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();
  const motionSet = reduced ? FADE : SWAP;

  useEffect(() => {
    const node = firstCell.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "100px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setPageVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    if (held || !inView || !pageVisible) return;
    const timer = setInterval(() => setStep((value) => value + 1), STEP_MS);
    return () => clearInterval(timer);
  }, [held, inView, pageVisible]);

  return columns.map((column, index) => {
    const sponsor = column[step % column.length];
    return (
      <Link
        key={column[0].id}
        ref={index === 0 ? firstCell : undefined}
        href={sponsor.website}
        target="_blank"
        rel="noreferrer"
        onPointerEnter={() => setHeld(true)}
        onPointerLeave={() => setHeld(false)}
        onFocus={() => setHeld(true)}
        onBlur={() => setHeld(false)}
        className={cn(
          CELL,
          "relative h-[78px] overflow-clip lg:h-24",
          cellClassNames[index],
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={sponsor.id}
            {...motionSet}
            transition={{ duration: 0.5, ease: EASE, delay: index * WAVE_S }}
            className="flex items-center justify-center"
          >
            <SponsorLogo sponsor={sponsor} />
          </motion.span>
        </AnimatePresence>
      </Link>
    );
  });
}
