"use client";

import { interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type StrikethroughReplaceElementId,
  strikethroughReplaceTimeline,
} from "./timeline";

export interface StrikethroughReplaceProps {
  from: string;
  to: string;
  lineColor?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the strike and the swap, by the ids in
   * `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<StrikethroughReplaceElementId>;
}

export function StrikethroughReplace(props: StrikethroughReplaceProps) {
  const {
    from,
    to,
    lineColor = "#ff5e3a",
    fontSize = 48,
    color = "#171717",
    fontWeight = 600,
    speed = 1,
    className,
    timing,
  } = props;
  const glide = useGlide();
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  // The phases are shares of the composition length without `speed`.
  const tl = useTimeline(
    strikethroughReplaceTimeline,
    props,
    durationInFrames,
    timing,
  );
  const strike = tl.get("strike");
  const swap = tl.get("swap");

  // Phases:
  // 0 .. 40% -> draw strikethrough across `from`
  // 40% .. 60% -> fade out `from`, fade in `to`
  // 60% .. 100% -> hold
  const fadeStart = swap.start;
  const fadeEnd = swap.end;

  const linePct = interpolate(frame, [strike.start, strike.end], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fromOpacity = interpolate(frame, [fadeStart, fadeEnd], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const toOpacity = interpolate(frame, [fadeStart, fadeEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const toY = interpolate(frame, [fadeStart, fadeEnd], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Chrome parks a glyph raster on a whole pixel vertically for as long as the
  // matrix is axis-aligned, so text under a slow translate clicks along pixel
  // by pixel. The rise is a marked transform, so the text leans off that grid
  // while it rises.
  const rising = toY > 0 && toY < 8;

  const textStyle: React.CSSProperties = {
    fontSize,
    fontWeight,
    color,
    letterSpacing: "-0.03em",
    fontFamily:
      "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
    whiteSpace: "nowrap",
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
      <div
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* from text with strikethrough line */}
        <span
          className={className}
          style={{
            ...textStyle,
            position: "absolute",
            opacity: fromOpacity,
          }}
        >
          {from}
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              height: Math.max(2, Math.round(fontSize * 0.08)),
              width: `${linePct}%`,
              background: lineColor,
              translate: "0 -50%",
              borderRadius: 2,
            }}
          />
        </span>

        {/* to text */}
        <span
          className={className}
          style={{
            ...textStyle,
            opacity: toOpacity,
            transform: `translateY(${toY}px)${glide(rising)}`,
          }}
        >
          {to}
        </span>
      </div>
    </div>
  );
}
