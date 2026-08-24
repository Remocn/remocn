"use client";

import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface WordPushProps {
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  wordGap?: number;
  accel?: number;
  speed?: number;
  className?: string;
}

const REVEAL_FRAMES = 2;
const SLIDE_FRAMES = 12;
const OVERSHOOT_EM = 0.5;
const CHAR_WIDTH_EM = 0.5;
const SPACE_WIDTH_EM = 0.22;

function revealFrame(index: number, wordGap: number, accel: number): number {
  if (accel === 1) return index * wordGap;
  return (wordGap * (1 - accel ** index)) / (1 - accel);
}

export function wordPushLength(text: string, wordGap = 10, accel = 0.8): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  return Math.ceil(revealFrame(words.length - 1, wordGap, accel)) + SLIDE_FRAMES;
}

const pushEasing = Easing.out(Easing.cubic);
const driveEasing = Easing.bezier(0.15, 0.7, 0.25, 1);

export function WordPush({
  text,
  fontSize = 72,
  color = "#171717",
  fontWeight = 500,
  wordGap = 10,
  accel = 0.8,
  speed = 1,
  className,
}: WordPushProps) {
  const frame = useCurrentFrame() * speed;

  const words = text.trim().split(/\s+/).filter(Boolean);

  let lineX = interpolate(
    frame,
    [0, SLIDE_FRAMES],
    [-OVERSHOOT_EM * fontSize, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: driveEasing,
    },
  );
  for (let j = 1; j < words.length; j++) {
    const wordWidth =
      (words[j].length * CHAR_WIDTH_EM + SPACE_WIDTH_EM) * fontSize;
    const revealAt = revealFrame(j, wordGap, accel);
    const pushed = interpolate(
      frame,
      [revealAt + 1, revealAt + 1 + SLIDE_FRAMES],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: pushEasing,
      },
    );
    lineX += (wordWidth / 2) * (1 - pushed);
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        translate: `${lineX}px 0`,
        background: "transparent",
      }}
    >
      <span
        className={className}
        style={{
          fontSize,
          fontWeight,
          color,
          letterSpacing: "-0.02em",
          fontFamily:
            "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
        }}
      >
        {words.map((word, j) => {
          const revealAt = revealFrame(j, wordGap, accel);

          const opacity = interpolate(
            frame,
            [revealAt, revealAt + REVEAL_FRAMES],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          const driven =
            j === 0
              ? 1
              : interpolate(frame, [revealAt, revealAt + SLIDE_FRAMES], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: driveEasing,
                });

          return (
            <span
              key={j}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                marginRight: j < words.length - 1 ? "0.22em" : undefined,
                opacity,
                translate: `${OVERSHOOT_EM * fontSize * (1 - driven)}px 0`,
              }}
            >
              {word}
            </span>
          );
        })}
      </span>
    </div>
  );
}
