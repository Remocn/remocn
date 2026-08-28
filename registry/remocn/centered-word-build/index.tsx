"use client";

import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface CenteredWordBuildProps {
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  wordGap?: number;
  accel?: number;
  rise?: number;
  zoomStep?: number;
  settleFrames?: number;
  exitAt?: number;
  exitFrames?: number;
  speed?: number;
  className?: string;
}

function revealFrame(index: number, wordGap: number, accel: number): number {
  let frame = 0;

  for (let step = 1; step <= index; step++) {
    // Establish two even beats before tightening the cadence.
    frame += wordGap * accel ** Math.max(step - 2, 0);
  }

  return Math.round(frame);
}

export function centeredWordBuildLength(
  text: string,
  wordGap = 11,
  accel = 0.75,
  settleFrames = 9,
  exitAt = 51,
  exitFrames = 12,
): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;

  const lastReveal = revealFrame(words.length - 1, wordGap, accel);
  return Math.max(lastReveal + settleFrames, exitAt + exitFrames);
}

const settleEasing = Easing.bezier(0.16, 1, 0.3, 1);

export function CenteredWordBuild({
  text,
  fontSize = 52,
  color = "#fff3df",
  fontWeight = 400,
  wordGap = 11,
  accel = 0.75,
  rise = 0.18,
  zoomStep = 0.035,
  settleFrames = 9,
  exitAt = 51,
  exitFrames = 12,
  speed = 1,
  className,
}: CenteredWordBuildProps) {
  const frame = useCurrentFrame() * speed;
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return null;

  const visibleCount = words.filter(
    (_, index) => frame >= revealFrame(index, wordGap, accel),
  ).length;
  let cameraScale = 1;
  for (let index = 1; index < visibleCount; index++) {
    const revealAt = revealFrame(index, wordGap, accel);
    cameraScale +=
      zoomStep *
      interpolate(
        frame,
        [revealAt, revealAt + Math.max(settleFrames, 0.001)],
        [0, 1],
        {
          easing: settleEasing,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );
  }
  const exitProgress = interpolate(
    frame,
    [exitAt, exitAt + Math.max(exitFrames, 0.001)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const fadeStart = -35 + exitProgress * 135;
  const fadeEnd = fadeStart + 35;
  const exitMask = `linear-gradient(90deg, transparent ${fadeStart}%, black ${fadeEnd}%)`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "transparent",
      }}
    >
      <span
        className={className}
        style={{
          color,
          display: "inline-block",
          fontFamily:
            "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
          fontSize,
          fontWeight,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          scale: `${cameraScale}`,
          opacity: exitProgress >= 1 ? 0 : 1,
          maskImage: exitProgress > 0 ? exitMask : undefined,
          WebkitMaskImage: exitProgress > 0 ? exitMask : undefined,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      >
        {words.slice(0, visibleCount).map((word, index) => {
          const revealAt = revealFrame(index, wordGap, accel);
          const y = interpolate(
            frame,
            [revealAt, revealAt + Math.max(settleFrames, 0.001)],
            [rise * fontSize, 0],
            {
              easing: settleEasing,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          );

          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                marginLeft: index > 0 ? "0.25em" : undefined,
                translate: `0 ${y}px`,
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
