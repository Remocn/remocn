"use client";

import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface PerCharacterRiseProps {
  text: string;
  distance?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
}

export function PerCharacterRise({
  text,
  distance = 32,
  fontSize = 72,
  color = "#171717",
  fontWeight = 600,
  speed = 1,
  className,
}: PerCharacterRiseProps) {
  const frame = useCurrentFrame() * speed;

  const chars = Array.from(text);
  const charDurationFrames = 21;
  const staggerFrames = 1;

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
          letterSpacing: "-0.05em",
          fontFamily:
            "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {chars.map((char, i) => {
          const local = frame - i * staggerFrames;
          const easing = Easing.bezier(0.2, 0.8, 0.2, 1);
          const opacity = interpolate(
            local,
            [0, charDurationFrames],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing },
          );
          const y = interpolate(
            local,
            [0, charDurationFrames],
            [distance, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing },
          );
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                backfaceVisibility: "hidden",
                transformOrigin: "50% 55%",
                opacity,
                transform: `translateY(${y}px)`,
              }}
            >
              {char}
            </span>
          );
        })}
      </span>
    </div>
  );
}
