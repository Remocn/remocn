"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type SharedAxisZElementId, sharedAxisZTimeline } from "./timeline";

export interface SharedAxisZProps {
  fromText: string;
  toText: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the old line's exit and the new line's entry,
   * by the ids in `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<SharedAxisZElementId>;
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

export function SharedAxisZ(props: SharedAxisZProps) {
  const {
    fromText,
    toText,
    fontSize = 72,
    color = "#171717",
    fontWeight = 600,
    speed = 1,
    className,
    timing,
  } = props;
  const glide = useGlide();
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    sharedAxisZTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const exit = tl.get("out");
  const enter = tl.get("in");

  const exitEasing = Easing.bezier(0.4, 0, 1, 1);
  const enterEasing = Easing.bezier(0.2, 0, 0, 1);

  const fromP = interpolate(frame - exit.start, [0, exit.length], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fromOpacity = interpolate(
    frame - exit.start,
    [0, exit.length],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: exitEasing,
    },
  );
  const fromScale = interpolate(
    frame - exit.start,
    [0, exit.length],
    [1, 1.06],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: exitEasing,
    },
  );
  const fromBlur = interpolate(frame - exit.start, [0, exit.length], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });

  const local = frame - enter.start;
  const toP = interpolate(local, [0, enter.length], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const toOpacity = interpolate(local, [0, enter.length], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });
  const toScale = interpolate(local, [0, enter.length], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });
  const toBlur = interpolate(local, [0, enter.length], [2, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });

  const fontStack =
    "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        background: "transparent",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight,
            color,
            letterSpacing: "-0.03em",
            fontFamily: fontStack,
            display: "inline-block",
            transformOrigin: "50% 50%",
            opacity: fromOpacity,
            transform: `scale(${fromScale})${glide(midway(fromP))}`,
            filter: `blur(${fromBlur}px)`,
          }}
        >
          {fromText}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight,
            color,
            letterSpacing: "-0.03em",
            fontFamily: fontStack,
            display: "inline-block",
            transformOrigin: "50% 50%",
            opacity: toOpacity,
            transform: `scale(${toScale})${glide(midway(toP))}`,
            filter: `blur(${toBlur}px)`,
          }}
        >
          {toText}
        </span>
      </div>
    </div>
  );
}
