"use client";

import type React from "react";
import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type RolodexFlipElementId, rolodexFlipTimeline } from "./timeline";

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
  /**
   * Moves, trims or stretches single flips, by the ids in `./timeline`.
   * Frames on the scene timeline.
   */
  timing?: Timing<RolodexFlipElementId>;
}

export function RolodexFlip(props: RolodexFlipProps) {
  const { items, className, style, timing } = props;
  const glide = useGlide();
  const frame = useSceneFrame();
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(rolodexFlipTimeline, props, durationInFrames, timing);
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
        // Word `i` turns in on flip `i` and out on flip `i + 1`.
        const flipIn = i > 0 ? tl.get(`flip:${i}`) : undefined;
        const flipOut =
          i < items.length - 1 ? tl.get(`flip:${i + 1}`) : undefined;

        const poseAt = (f: number) => {
          let rotate = 0;
          let y = 0;
          let opacity = 1;

          if (flipIn) {
            const inStart = flipIn.start + flipIn.beat("inAt");
            const pIn = interpolate(
              f,
              [inStart, inStart + flipIn.beat("in")],
              [0, 1],
              { ...clampOpts, easing: Easing.out(Easing.cubic) },
            );
            rotate = (1 - pIn) * -85;
            y = (1 - pIn) * 20;
            opacity = pIn;
          }
          if (flipOut) {
            const pOut = interpolate(
              f,
              [flipOut.start, flipOut.start + flipOut.beat("out")],
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
