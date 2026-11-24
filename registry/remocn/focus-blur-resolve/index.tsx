"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type FocusBlurResolveElementId,
  focusBlurResolveTimeline,
} from "./timeline";

export interface FocusBlurResolveProps {
  text: string;
  blur?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the way in and the way out, by the ids in
   * `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<FocusBlurResolveElementId>;
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

export function FocusBlurResolve(props: FocusBlurResolveProps) {
  const {
    text,
    blur = 14,
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
  // The exit is timed against the composition length without `speed`.
  const tl = useTimeline(
    focusBlurResolveTimeline,
    props,
    durationInFrames,
    timing,
  );
  const enter = tl.get("enter");
  const exit = tl.get("exit");

  const enterEasing = Easing.bezier(0.22, 1, 0.36, 1);
  const exitEasing = Easing.bezier(0.64, 0, 0.78, 0);

  const enterP = interpolate(frame, [enter.start, enter.end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });

  const exitP = interpolate(frame, [exit.start, exit.end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });

  const opacity = enterP * (1 - exitP);

  const yEnter = interpolate(frame, [enter.start, enter.end], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });

  const yExit = interpolate(frame, [exit.start, exit.end], [0, -10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });

  const y = yEnter + yExit;

  const blurEnter = interpolate(frame, [enter.start, enter.end], [blur, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });

  const blurExit = interpolate(frame, [exit.start, exit.end], [0, 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });

  const blurVal = blurEnter + blurExit;

  const scale = interpolate(frame, [enter.start, enter.end], [1.01, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <span
        className={className}
        style={{
          fontSize,
          fontWeight,
          color,
          letterSpacing: "-0.03em",
          fontFamily:
            "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
          display: "inline-block",
          transformOrigin: "50% 50%",
          opacity,
          // One `transform` rather than `translate` and `scale`: the mark
          // that leans the line while it rises rides on `transform` only.
          transform: `translate(0px, ${y}px) scale(${scale})${glide(midway(enterP) || midway(exitP))}`,
          filter: `blur(${blurVal}px)`,
        }}
      >
        {text}
      </span>
    </div>
  );
}
