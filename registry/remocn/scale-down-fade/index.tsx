"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type ScaleDownFadeElementId, scaleDownFadeTimeline } from "./timeline";

export interface ScaleDownFadeProps {
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the enter and the exit, by the ids in
   * `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<ScaleDownFadeElementId>;
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

export function ScaleDownFade(props: ScaleDownFadeProps) {
  const {
    text,
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
  // The exit has always been pinned to the clip's end without `speed`: a
  // faster tempo holds the text longer before it goes.
  const tl = useTimeline(
    scaleDownFadeTimeline,
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
  // Raw progress, not the eased one: the enter curve flattens out long before
  // the text stops crossing pixels.
  const clamp = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  const moving =
    midway(interpolate(frame, [enter.start, enter.end], [0, 1], clamp)) ||
    midway(interpolate(frame, [exit.start, exit.end], [0, 1], clamp));

  const yEnter = interpolate(frame, [enter.start, enter.end], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });

  const yExit = interpolate(frame, [exit.start, exit.end], [0, -8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });

  const y = yEnter + yExit;

  const scaleEnter = interpolate(frame, [enter.start, enter.end], [1.04, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });

  const scaleExitDelta = interpolate(
    frame,
    [exit.start, exit.end],
    [0, -0.06],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: exitEasing,
    },
  );

  const scale = scaleEnter + scaleExitDelta;

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
          transform: `translateY(${y}px) scale(${scale})${glide(moving)}`,
        }}
      >
        {text}
      </span>
    </div>
  );
}
