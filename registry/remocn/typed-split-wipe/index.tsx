"use client";

import type { CSSProperties } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface TypedSplitWipeProps {
  prefix: string;
  anchor: string;
  suffix: string;
  typeFrames?: number;
  exitAt?: number;
  exitFrames?: number;
  wordStagger?: number;
  anchorShift?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
}

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const wipeEasing = Easing.inOut(Easing.quad);

export function TypedSplitWipe({
  prefix,
  anchor,
  suffix,
  typeFrames = 30,
  exitAt = 50,
  exitFrames = 20,
  wordStagger = 4,
  anchorShift = -72,
  fontSize = 42,
  color = "#e8e8e8",
  fontWeight = 400,
  speed = 1,
  className,
}: TypedSplitWipeProps) {
  const frame = useCurrentFrame() * speed;
  const fullText = [prefix, anchor, suffix].filter(Boolean).join(" ");
  const safeTypeFrames = Math.max(typeFrames, 0.001);
  const safeExitFrames = Math.max(exitFrames, 0.001);
  const typedLength = interpolate(
    frame,
    [0, safeTypeFrames],
    [0, fullText.length],
    clamp,
  );
  const visibleLength = Math.min(
    fullText.length,
    Math.max(frame >= 0 ? 1 : 0, Math.floor(typedLength) + 1),
  );
  const typedText = fullText.slice(0, visibleLength);
  const suffixWords = suffix.trim().split(/\s+/).filter(Boolean);

  const textStyle: CSSProperties = {
    color,
    fontFamily:
      "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
    fontSize,
    fontWeight,
    letterSpacing: "-0.03em",
    lineHeight: 1,
    whiteSpace: "pre",
  };

  const prefixExit = interpolate(
    frame,
    [exitAt, exitAt + safeExitFrames],
    [0, 1],
    { ...clamp, easing: wipeEasing },
  );
  const anchorExitStart = exitAt + Math.max(exitFrames - 6, 0);
  const anchorExit = interpolate(
    frame,
    [anchorExitStart, anchorExitStart + 6],
    [0, 1],
    { ...clamp, easing: wipeEasing },
  );

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
      {frame < exitAt ? (
        <span className={className} style={textStyle}>
          {typedText}
        </span>
      ) : (
        <span
          className={className}
          style={{
            ...textStyle,
            display: "inline-flex",
            alignItems: "baseline",
            gap: "0.25em",
          }}
        >
          {prefix && (
            <span
              style={{
                display: "inline-block",
                clipPath: `inset(0 ${prefixExit * 100}% 0 0)`,
              }}
            >
              {prefix}
            </span>
          )}

          {anchor && (
            <span
              style={{
                display: "inline-block",
                clipPath: `inset(0 ${anchorExit * 50}% 0 ${anchorExit * 50}%)`,
                transform: `translateX(${anchorShift * prefixExit}px)`,
              }}
            >
              {anchor}
            </span>
          )}

          {suffixWords.map((word, index) => {
            const wordExitStart = exitAt + 2 + index * wordStagger;
            const wordExit = interpolate(
              frame,
              [wordExitStart, wordExitStart + safeExitFrames * 0.65],
              [0, 1],
              { ...clamp, easing: wipeEasing },
            );

            return (
              <span
                key={`${word}-${index}`}
                style={{
                  display: "inline-block",
                  clipPath: `inset(0 0 0 ${wordExit * 100}%)`,
                }}
              >
                {word}
              </span>
            );
          })}
        </span>
      )}
    </div>
  );
}
