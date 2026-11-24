"use client";

import { interpolate, interpolateColors, spring } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type MarkerHighlightElementId,
  markerHighlightTimeline,
} from "./timeline";

export interface MarkerHighlightProps {
  before?: string;
  highlight: string;
  after?: string;
  markerColor?: string;
  baseColor?: string;
  highlightedTextColor?: string;
  fontSize?: number;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves the marker sweep, by the ids in `./timeline`. Frames on the scene
   * timeline, after `speed`.
   */
  timing?: Timing<MarkerHighlightElementId>;
}

export function MarkerHighlight(props: MarkerHighlightProps) {
  const {
    before = "",
    highlight,
    after = "",
    markerColor = "#facc15",
    baseColor = "#171717",
    highlightedTextColor = "#171717",
    fontSize = 72,
    fontWeight = 600,
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    markerHighlightTimeline,
    props,
    durationInFrames * speed,
    timing,
  );

  const markerScale = spring({
    frame: frame - tl.get("marker").start,
    fps,
    config: { damping: 14 },
  });

  const textColor = interpolateColors(
    interpolate(markerScale, [0.5, 0.8], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    [0, 1],
    [baseColor, highlightedTextColor],
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
        <span style={{ position: "relative", display: "inline-block" }}>
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: "0 -0.1em",
              background: markerColor,
              transformOrigin: "left center",
              scale: `${markerScale} 1`,
              zIndex: 0,
            }}
          />
          <span style={{ position: "relative", zIndex: 1, color: textColor }}>
            {highlight}
          </span>
        </span>
        {after}
      </span>
    </div>
  );
}
