"use client";

import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const FOLLOW = {
  type: "spring",
  visualDuration: 0.06,
  bounce: 0,
  restDelta: 0.5,
} as const;

const TONES = {
  sunken: { color: "--surface", radius: 12 },
  plain: { color: "--surface-muted", radius: 10 },
} as const;

const TARGET = "[data-menu-link]:not([data-no-highlight])";

export function HoverZone({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion() ?? false;
  const zoneRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const width = useMotionValue(0);
  const height = useMotionValue(0);
  const radius = useMotionValue(10);
  const color = useMotionValue("rgba(0, 0, 0, 0)");
  const transform = useMotionTemplate`translate3d(${x}px, ${y}px, 0)`;

  useEffect(() => {
    const zone = zoneRef.current;
    if (!zone) return;
    let current: Element | null = null;
    let visible = false;

    const follow = (target: EventTarget | null) => {
      const link = target instanceof Element ? target.closest(TARGET) : null;
      if (!link || !zone.contains(link) || link === current) return;
      current = link;
      const zoneRect = zone.getBoundingClientRect();
      const rect = link.getBoundingClientRect();
      const next = [
        rect.left - zoneRect.left,
        rect.top - zoneRect.top,
        rect.width,
        rect.height,
      ];
      const values = [x, y, width, height];
      const toneName = link.closest<HTMLElement>("[data-tone]")?.dataset.tone;
      const tone = toneName === "sunken" ? TONES.sunken : TONES.plain;
      const nextColor = getComputedStyle(zone)
        .getPropertyValue(tone.color)
        .trim();
      if (!visible || reduced) {
        radius.jump(tone.radius);
        color.jump(nextColor);
        values.forEach((value, i) => {
          value.jump(next[i]);
        });
        visible = true;
        setShown(true);
        return;
      }
      values.forEach((value, i) => {
        animate(value, next[i], FOLLOW);
      });
      animate(radius, tone.radius, FOLLOW);
      animate(color, nextColor, FOLLOW);
    };

    const hide = () => {
      current = null;
      visible = false;
      setShown(false);
    };

    const onOver = (event: PointerEvent) => follow(event.target);
    const onFocusIn = (event: FocusEvent) => follow(event.target);
    const onFocusOut = (event: FocusEvent) => {
      if (!zone.contains(event.relatedTarget as Node | null)) hide();
    };

    zone.addEventListener("pointerover", onOver);
    zone.addEventListener("pointerleave", hide);
    zone.addEventListener("focusin", onFocusIn);
    zone.addEventListener("focusout", onFocusOut);
    return () => {
      zone.removeEventListener("pointerover", onOver);
      zone.removeEventListener("pointerleave", hide);
      zone.removeEventListener("focusin", onFocusIn);
      zone.removeEventListener("focusout", onFocusOut);
    };
  }, [reduced, x, y, width, height, radius, color]);

  return (
    <div ref={zoneRef} className={cn("relative isolate", className)}>
      <motion.span
        aria-hidden="true"
        initial={false}
        style={{
          transform,
          width,
          height,
          borderRadius: radius,
          backgroundColor: color,
        }}
        animate={{ opacity: shown ? 1 : 0 }}
        transition={{
          duration: reduced ? 0 : shown ? 0.1 : 0.16,
          ease: "easeOut",
        }}
        className="pointer-events-none absolute top-0 left-0 z-0"
      />
      {children}
    </div>
  );
}
