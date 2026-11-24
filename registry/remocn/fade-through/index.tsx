"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type FadeThroughElementId, fadeThroughTimeline } from "./timeline";

export interface FadeThroughProps {
  fromText: string;
  toText: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the line going out and the line coming in, by
   * the ids in `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<FadeThroughElementId>;
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

export function FadeThrough(props: FadeThroughProps) {
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
    fadeThroughTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const out = tl.get("exit");
  const into = tl.get("enter");

  const exitEasing = Easing.bezier(0.4, 0, 1, 1);
  const enterEasing = Easing.bezier(0.2, 0, 0, 1);

  const fromP = interpolate(frame, [out.start, out.end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fromOpacity = interpolate(frame, [out.start, out.end], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });
  const fromY = interpolate(frame, [out.start, out.end], [0, -4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });

  const local = frame - into.start;
  const toP = interpolate(local, [0, into.length], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const toOpacity = interpolate(local, [0, into.length], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });
  const toY = interpolate(local, [0, into.length], [6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });
  const toScale = interpolate(local, [0, into.length], [0.99, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });
  const blurVal = interpolate(local, [0, into.length], [2, 0], {
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
            // One transform rather than `translate`: the mark that gets the
            // line its lean is read from `transform` only.
            transform: `translateY(${fromY}px)${glide(midway(fromP))}`,
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
            transform: `translateY(${toY}px) scale(${toScale})${glide(midway(toP))}`,
            filter: `blur(${blurVal}px)`,
          }}
        >
          {toText}
        </span>
      </div>
    </div>
  );
}
