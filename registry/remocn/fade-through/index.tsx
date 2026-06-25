"use client";

import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface FadeThroughProps {
  fromText: string;
  toText: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
}

export function FadeThrough({
  fromText,
  toText,
  fontSize = 72,
  color = "#171717",
  fontWeight = 600,
  speed = 1,
  className,
}: FadeThroughProps) {
  const frame = useCurrentFrame() * speed;

  const exitDur = 8;
  const enterDur = 13;
  const overlapF = 1;
  const microDelayF = 2;

  const exitTotal = exitDur;
  const newStart = Math.max(0, exitTotal - overlapF + microDelayF);

  const exitEasing = Easing.bezier(0.4, 0, 1, 1);
  const enterEasing = Easing.bezier(0.2, 0, 0, 1);

  const fromOpacity = interpolate(frame, [0, exitDur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });
  const fromY = interpolate(frame, [0, exitDur], [0, -4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });

  const local = frame - newStart;
  const toOpacity = interpolate(local, [0, enterDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });
  const toY = interpolate(local, [0, enterDur], [6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });
  const toScale = interpolate(local, [0, enterDur], [0.99, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: enterEasing,
  });
  const blurVal = interpolate(local, [0, enterDur], [2, 0], {
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
            transform: `translateY(${fromY}px)`,
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
            transform: `translateY(${toY}px) scale(${toScale})`,
            filter: `blur(${blurVal}px)`,
          }}
        >
          {toText}
        </span>
      </div>
    </div>
  );
}
