"use client";

import type React from "react";
import { Easing, interpolate } from "remotion";
import { useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";

const clampOpts = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export interface RolodexFlipProps {
  items: string[];
  from?: number;
  interval?: number;
  flipDuration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function RolodexFlip({
  items,
  from = 0,
  interval = 20,
  flipDuration = 10,
  className,
  style,
}: RolodexFlipProps) {
  const glide = useGlide();
  const frame = useSceneFrame();
  const sizer = items.reduce((a, b) => (b.length > a.length ? b : a), "");
  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        perspective: 420,
        verticalAlign: "bottom",
        ...style,
      }}
    >
      <span style={{ visibility: "hidden" }}>{sizer}</span>
      {items.map((item, i) => {
        const inStart = from + (i - 1) * interval + flipDuration / 2;
        const outStart = from + i * interval;

        const poseAt = (f: number) => {
          let rotate = 0;
          let y = 0;
          let opacity = 1;

          if (i > 0) {
            const pIn = interpolate(
              f,
              [inStart, inStart + flipDuration],
              [0, 1],
              { ...clampOpts, easing: Easing.out(Easing.cubic) },
            );
            rotate = (1 - pIn) * -85;
            y = (1 - pIn) * 20;
            opacity = pIn;
          }
          if (i < items.length - 1) {
            const pOut = interpolate(
              f,
              [outStart, outStart + flipDuration],
              [0, 1],
              { ...clampOpts, easing: Easing.in(Easing.cubic) },
            );
            rotate += pOut * 85;
            y -= pOut * 20;
            opacity *= 1 - pOut;
          }
          return { rotate, y, opacity };
        };
        const { rotate, y, opacity } = poseAt(frame);
        // A word lands flat out of its flip, where a fractional baseline
        // would snap to a whole pixel; the mark keeps it off that grid.
        const turnAt = (f: number) => {
          const p = poseAt(f);
          return `${p.rotate} ${p.y}`;
        };
        const here = `${rotate} ${y}`;
        const moving = here !== turnAt(frame - 1) || here !== turnAt(frame + 1);
        if (opacity <= 0.001) return null;

        return (
          <span
            key={`${i}-${item}`}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              whiteSpace: "nowrap",
              opacity,
              transform: `translateY(${y}px) rotateX(${rotate}deg)${glide(moving)}`,
              transformOrigin: "50% 50%",
              backfaceVisibility: "hidden",
            }}
          >
            {item}
          </span>
        );
      })}
    </span>
  );
}
