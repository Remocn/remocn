"use client";

import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export interface StrikethroughReplaceProps {
  from: string;
  to: string;
  lineColor?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
}

export function StrikethroughReplace({
  from,
  to,
  lineColor = "#ff5e3a",
  fontSize = 48,
  color = "#171717",
  fontWeight = 600,
  speed = 1,
  className,
}: StrikethroughReplaceProps) {
  const frame = useCurrentFrame() * speed;
  const { durationInFrames } = useVideoConfig();

  // Phases:
  // 0 .. 40% -> draw strikethrough across `from`
  // 40% .. 60% -> fade out `from`, fade in `to`
  // 60% .. 100% -> hold
  const strikeEnd = durationInFrames * 0.4;
  const fadeStart = durationInFrames * 0.4;
  const fadeEnd = durationInFrames * 0.6;

  const linePct = interpolate(frame, [0, strikeEnd], [0, 100], {
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
            translate: `0 ${toY}px`,
          }}
        >
          {to}
        </span>
      </div>
    </div>
  );
}
