"use client";

import { interpolate, spring } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import { type TrackingInElementId, trackingInTimeline } from "./timeline";

export interface TrackingInProps {
  text: string;
  startTracking?: number;
  startBlur?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the entrance, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<TrackingInElementId>;
}

export function TrackingIn(props: TrackingInProps) {
  const {
    text,
    startTracking = 0.5,
    startBlur = 12,
    fontSize = 96,
    color = "#171717",
    fontWeight = 700,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    trackingInTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const enter = tl.get("enter");

  const t = spring({
    frame: frame - enter.start,
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  const letterSpacing = `${interpolate(t, [0, 1], [startTracking, -0.03])}em`;
  const blurAmount = interpolate(t, [0, 1], [startBlur, 0]);
  const opacity = interpolate(
    frame,
    [enter.start, enter.start + enter.beat("fade")],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

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
      <span
        className={className}
        style={{
          fontSize,
          fontWeight,
          color,
          letterSpacing,
          opacity,
          filter: `blur(${blurAmount}px)`,
          fontFamily:
            "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>
    </div>
  );
}
