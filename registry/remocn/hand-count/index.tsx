"use client";

import { loadFont } from "@remotion/google-fonts/Caveat";
import { useCurrentFrame } from "remotion";
import {
  DEFAULT_STEP,
  hashRange,
  qstep,
  steppedRamp,
} from "@/lib/remocn/stop-motion";

const { fontFamily: HAND_FAMILY } = loadFont("normal", {
  subsets: ["latin"],
  weights: ["400", "500", "600", "700"],
});

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

const DEFAULT_DURATION_STEPS = 18;

export type HandCountEase = "in-out" | "out" | "linear";

const EASES: Record<HandCountEase, (t: number) => number> = {
  "in-out": easeInOutCubic,
  out: easeOutCubic,
  linear: (t: number) => t,
};

export type HandCountTiming = {
  delay?: number;
  durationSteps?: number;
  step?: number;
};

export function handCountDuration(options?: HandCountTiming): number {
  const delay = options?.delay ?? 0;
  const durationSteps = options?.durationSteps ?? DEFAULT_DURATION_STEPS;
  const step = options?.step ?? DEFAULT_STEP;
  const end = delay + durationSteps * step;
  return Math.ceil(end / step) * step;
}

export function handCountValue(
  args: HandCountTiming & {
    frame: number;
    to: number;
    from?: number;
    ease?: HandCountEase;
  },
): number {
  const from = args.from ?? 0;
  const delay = args.delay ?? 0;
  const durationSteps = args.durationSteps ?? DEFAULT_DURATION_STEPS;
  const step = args.step ?? DEFAULT_STEP;
  const progress = steppedRamp(
    args.frame,
    delay,
    delay + durationSteps * step,
    {
      ease: EASES[args.ease ?? "in-out"],
      step,
    },
  );
  return from + (args.to - from) * progress;
}

export function handCountText(
  value: number,
  options?: { decimals?: number; prefix?: string; suffix?: string },
): string {
  return `${options?.prefix ?? ""}${value.toFixed(options?.decimals ?? 0)}${options?.suffix ?? ""}`;
}

export function handCountPose(
  frame: number,
  options?: HandCountTiming,
): number {
  const step = options?.step ?? DEFAULT_STEP;
  const settled = handCountDuration(options);
  return Math.min(qstep(Math.max(0, frame), step), qstep(settled, step));
}

export function handCountJitter(
  args: HandCountTiming & { frame: number; index: number; seed?: string },
): { rot: number; dy: number } {
  const seed = args.seed ?? "count";
  const pose = handCountPose(args.frame, args);
  return {
    rot: hashRange(`${seed}:${pose}:${args.index}:r`, -3.2, 3.2),
    dy: hashRange(`${seed}:${pose}:${args.index}:y`, -1.8, 1.8),
  };
}

export interface HandCountProps {
  to: number;
  from?: number;
  delay?: number;
  durationSteps?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  fontSize?: number;
  color?: string;
  weight?: 400 | 500 | 600 | 700;
  ease?: HandCountEase;
  align?: "left" | "center";
  fontFamily?: string;
  seed?: string;
  step?: number;
}

export function HandCount({
  to,
  from = 0,
  delay = 0,
  durationSteps = DEFAULT_DURATION_STEPS,
  decimals = 0,
  prefix = "",
  suffix = "",
  fontSize = 96,
  color = "#26242c",
  weight = 700,
  ease = "in-out",
  align = "center",
  fontFamily = HAND_FAMILY,
  seed = "count",
  step = DEFAULT_STEP,
}: HandCountProps) {
  const frame = useCurrentFrame();
  const value = handCountValue({
    frame,
    to,
    from,
    delay,
    durationSteps,
    step,
    ease,
  });
  const chars = Array.from(handCountText(value, { decimals, prefix, suffix }));

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: align === "center" ? "center" : "flex-start",
        background: "transparent",
      }}
    >
      <span
        style={{
          display: "inline-block",
          fontFamily: `${fontFamily}, cursive`,
          fontWeight: weight,
          fontSize,
          lineHeight: 1.15,
          color,
          whiteSpace: "pre",
          textAlign: align,
        }}
      >
        {chars.map((char, i) => {
          const { rot, dy } = handCountJitter({
            frame,
            index: i,
            seed,
            delay,
            durationSteps,
            step,
          });
          return (
            <span
              key={`${i}:${char}`}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                transform: `translateY(${dy}px) rotate(${rot}deg)`,
              }}
            >
              {char}
            </span>
          );
        })}
      </span>
    </div>
  );
}
