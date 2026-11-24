"use client";

import type React from "react";
import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type ValueSwapElementId, valueSwapTimeline } from "./timeline";

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export interface ValueSwapProps {
  values: string[];
  at: number | number[];
  duration?: number;
  distance?: number;
  direction?: "up" | "down";
  className?: string;
  style?: React.CSSProperties;
  /**
   * Moves, trims or stretches single swaps, by the ids in `./timeline`.
   * Frames on the scene timeline.
   */
  timing?: Timing<ValueSwapElementId>;
}

export function ValueSwap(props: ValueSwapProps) {
  const {
    values,
    at,
    distance = 12,
    direction = "up",
    className,
    style,
    timing,
  } = props;
  const frame = useSceneFrame();
  const { durationInFrames } = useSceneConfig();
  const glide = useGlide();
  const tl = useTimeline(valueSwapTimeline, props, durationInFrames, timing);
  const ats = Array.isArray(at) ? at : [at];
  const d = direction === "down" ? -distance : distance;
  const count = Math.min(values.length, ats.length + 1);
  const rendered = values.slice(0, count);
  const sizer = rendered.reduce((a, b) => (b.length > a.length ? b : a), "");
  const swapP = (i: number) => {
    const swap = tl.get(`swap:${i}`);
    return interpolate(frame, [swap.start, swap.end], [0, 1], {
      ...clampOpts,
      easing: Easing.inOut(Easing.cubic),
    });
  };
  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        ...style,
      }}
    >
      <span style={{ visibility: "hidden" }}>{sizer}</span>
      {rendered.map((value, i) => {
        const pIn = i > 0 ? swapP(i - 1) : 1;
        const pOut = i < count - 1 ? swapP(i) : 0;
        const opacity = pIn * (1 - pOut);
        if (opacity <= 0.001) return null;
        const y = (1 - pIn) * d + pOut * -d;
        const moving = (pIn > 0 && pIn < 1) || (pOut > 0 && pOut < 1);
        return (
          <span
            key={`${i}-${value}`}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              whiteSpace: "nowrap",
              opacity,
              transform: `translateY(${y}px)${glide(moving)}`,
            }}
          >
            {value}
          </span>
        );
      })}
    </span>
  );
}
