"use client";

import {
  motion,
  type TargetAndTransition,
  type Transition,
} from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export function Frame({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={style}
    >
      {children}
    </div>
  );
}

export function Letters({
  text,
  cycle,
  speed,
  initial,
  animate,
  transition,
  stagger = 0.04,
  delay = 0.15,
  className,
  letterClassName,
}: {
  text: string;
  cycle: number;
  speed: number;
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition?: Transition;
  stagger?: number;
  delay?: number;
  className?: string;
  letterClassName?: string;
}) {
  return (
    <span key={cycle} className={cn("inline-flex", className)}>
      {text.split("").map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          className={cn("inline-block whitespace-pre", letterClassName)}
          initial={initial}
          animate={animate}
          transition={{
            duration: 0.55 / speed,
            ease: EASE_OUT,
            ...transition,
            delay: (delay + i * stagger) / speed,
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

export function Words({
  words,
  cycle,
  speed,
  initial,
  animate,
  transition,
  stagger = 0.12,
  delay = 0.15,
  className,
  wordClassName,
}: {
  words: string[];
  cycle: number;
  speed: number;
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition?: Transition;
  stagger?: number;
  delay?: number;
  className?: string;
  wordClassName?: string;
}) {
  return (
    <span key={cycle} className={cn("flex flex-wrap", className)}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className={cn("inline-block", wordClassName)}
          initial={initial}
          animate={animate}
          transition={{
            duration: 0.55 / speed,
            ease: EASE_OUT,
            ...transition,
            delay: (delay + i * stagger) / speed,
          }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}
