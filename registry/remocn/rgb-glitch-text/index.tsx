"use client";

import { random, useCurrentFrame } from "remotion";

export interface RGBGlitchTextProps {
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  glitchAt?: number;
  glitchDuration?: number;
  intensity?: number;
  seed?: string;
  speed?: number;
  className?: string;
}

export function RGBGlitchText({
  text,
  fontSize = 96,
  color = "#171717",
  fontWeight = 700,
  glitchAt = 20,
  glitchDuration = 8,
  intensity = 6,
  seed = "glitch",
  speed = 1,
  className,
}: RGBGlitchTextProps) {
  const frame = useCurrentFrame() * speed;

  const isGlitching = frame >= glitchAt && frame < glitchAt + glitchDuration;

  const offset = (axisSeed: string, scale: number) =>
    (random(`${seed}-${axisSeed}-${frame}`) * 2 - 1) * scale;

  const rX = isGlitching ? offset("r-x", intensity) : 0;
  const rY = isGlitching ? offset("r-y", intensity * 0.4) : 0;
  const gX = isGlitching ? offset("g-x", intensity) : 0;
  const gY = isGlitching ? offset("g-y", intensity * 0.4) : 0;
  const bX = isGlitching ? offset("b-x", intensity) : 0;
  const bY = isGlitching ? offset("b-y", intensity * 0.4) : 0;

  const copyOpacity = isGlitching ? 1 : 0;

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    fontSize,
    fontWeight,
    letterSpacing: "-0.03em",
    fontFamily:
      "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
    whiteSpace: "pre",
    mixBlendMode: "multiply",
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fafafa",
      }}
    >
      <div
        className={className}
        style={{ position: "relative", display: "inline-block" }}
      >
        <span
          style={{
            position: "relative",
            fontSize,
            fontWeight,
            color,
            letterSpacing: "-0.03em",
            fontFamily:
              "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
            whiteSpace: "pre",
          }}
        >
          {text}
        </span>
        <span
          style={{
            ...baseStyle,
            color: "#ff0040",
            opacity: copyOpacity,
            translate: `${rX}px ${rY}px`,
          }}
        >
          {text}
        </span>
        <span
          style={{
            ...baseStyle,
            color: "#00ff80",
            opacity: copyOpacity,
            translate: `${gX}px ${gY}px`,
          }}
        >
          {text}
        </span>
        <span
          style={{
            ...baseStyle,
            color: "#0080ff",
            opacity: copyOpacity,
            translate: `${bX}px ${bY}px`,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}
