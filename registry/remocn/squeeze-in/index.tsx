"use client";

import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface SqueezeInProps {
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  stagger?: number;
  squeeze?: number;
  speed?: number;
  className?: string;
}

const SQUEEZE_FRAMES = 16;

export function squeezeInLength(text: string, stagger = 3): number {
  const chars = Array.from(text);
  if (chars.length === 0) return 0;
  return chars.length * stagger + SQUEEZE_FRAMES;
}

const squeezeEasing = Easing.out(Easing.cubic);

export function SqueezeIn({
  text,
  fontSize = 72,
  color = "#171717",
  fontWeight = 400,
  stagger = 3,
  squeeze = 0.03,
  speed = 1,
  className,
}: SqueezeInProps) {
  const frame = useCurrentFrame() * speed;

  const chars = Array.from(text);
  const lastRevealAt = chars.length * stagger;

  const squeezeProgress = interpolate(
    frame,
    [lastRevealAt, lastRevealAt + SQUEEZE_FRAMES],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: squeezeEasing,
    },
  );

  const gap = squeeze * fontSize * (1 - squeezeProgress);
  const wipe = interpolate(frame, [0, lastRevealAt], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const anchorX =
    (-squeeze * fontSize * squeezeProgress * (chars.length - 1)) / 2;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        background: "transparent",
      }}
    >
      <span
        className={className}
        style={{
          translate: `${anchorX}px 0`,
          clipPath: `inset(-0.2em ${wipe}% -0.25em -0.1em)`,
          fontSize,
          fontWeight,
          color,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          fontFamily:
            "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
        }}
      >
        {chars.map((char, j) => (
          <span
            key={j}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              marginRight: j < chars.length - 1 ? gap : undefined,
            }}
          >
            {char}
          </span>
        ))}
      </span>
    </div>
  );
}
