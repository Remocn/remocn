"use client";

import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface TrackingInProps {
  text: string;
  startTracking?: number;
  startBlur?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
}

export function TrackingIn({
  text,
  startTracking = 0.5,
  startBlur = 12,
  fontSize = 96,
  color = "#171717",
  fontWeight = 700,
  speed = 1,
  className,
}: TrackingInProps) {
  const frame = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const t = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  const letterSpacing = `${interpolate(t, [0, 1], [startTracking, -0.03])}em`;
  const blurAmount = interpolate(t, [0, 1], [startBlur, 0]);
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
