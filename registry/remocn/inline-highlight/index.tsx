"use client";

import { interpolate, interpolateColors } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type InlineHighlightElementId,
  inlineHighlightTimeline,
} from "./timeline";

export interface InlineHighlightProps {
  before: string;
  highlight: string;
  after?: string;
  baseColor?: string;
  highlightColor?: string;
  fontSize?: number;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the color shift, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<InlineHighlightElementId>;
}

export function InlineHighlight(props: InlineHighlightProps) {
  const {
    before,
    highlight,
    after = "",
    baseColor = "#171717",
    highlightColor = "#ff5e3a",
    fontSize = 48,
    fontWeight = 600,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  // The shift is timed against the composition length without `speed`.
  const tl = useTimeline(
    inlineHighlightTimeline,
    props,
    durationInFrames,
    timing,
  );
  const shift = tl.get("highlight");

  const progress = interpolate(frame, [shift.start, shift.end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const color = interpolateColors(
    progress,
    [0, 1],
    [baseColor, highlightColor],
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
          color: baseColor,
          letterSpacing: "-0.03em",
          fontFamily:
            "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {before}
        <span style={{ color }}>{highlight}</span>
        {after}
      </span>
    </div>
  );
}
