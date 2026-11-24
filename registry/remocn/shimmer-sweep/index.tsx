"use client";

import { interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type ShimmerSweepElementId, shimmerSweepTimeline } from "./timeline";

export interface ShimmerSweepProps {
  text: string;
  baseColor?: string;
  shineColor?: string;
  fontSize?: number;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the sweep, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<ShimmerSweepElementId>;
}

export function ShimmerSweep(props: ShimmerSweepProps) {
  const {
    text,
    baseColor = "#3f3f46",
    shineColor = "#fafafa",
    fontSize = 96,
    fontWeight = 700,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  // The sweep has always been a share of the clip without `speed`: a faster
  // tempo finishes it sooner and holds longer.
  const tl = useTimeline(shimmerSweepTimeline, props, durationInFrames, timing);
  const sweep = tl.get("sweep");

  const position = interpolate(frame, [sweep.start, sweep.end], [200, -100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textStyle: React.CSSProperties = {
    fontSize,
    fontWeight,
    letterSpacing: "-0.03em",
    fontFamily:
      "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
    margin: 0,
    lineHeight: 1,
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
      }}
    >
      <div style={{ position: "relative", display: "inline-block" }}>
        <span style={{ ...textStyle, color: baseColor }}>{text}</span>
        <span
          className={className}
          style={{
            ...textStyle,
            position: "absolute",
            inset: 0,
            color: "transparent",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            backgroundImage: `linear-gradient(110deg, transparent 30%, ${shineColor} 50%, transparent 70%)`,
            backgroundSize: "200% 100%",
            backgroundPosition: `${position}% 50%`,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}
