"use client";

import type React from "react";
import { Easing, interpolate } from "remotion";
import { useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

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
}

export function ValueSwap({
  values,
  at,
  duration = 10,
  distance = 12,
  direction = "up",
  className,
  style,
}: ValueSwapProps) {
  const frame = useSceneFrame();
  const glide = useGlide();
  const ats = Array.isArray(at) ? at : [at];
  const d = direction === "down" ? -distance : distance;
  const count = Math.min(values.length, ats.length + 1);
  const rendered = values.slice(0, count);
  const sizer = rendered.reduce((a, b) => (b.length > a.length ? b : a), "");
  const swapP = (start: number) =>
    interpolate(frame, [start, start + duration], [0, 1], {
      ...clampOpts,
      easing: Easing.inOut(Easing.cubic),
    });
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
        const pIn = i > 0 ? swapP(ats[i - 1]) : 1;
        const pOut = i < count - 1 ? swapP(ats[i]) : 0;
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
