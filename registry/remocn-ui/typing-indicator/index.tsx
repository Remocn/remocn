"use client";

import { useCurrentFrame, useVideoConfig } from "remotion";

export interface TypingIndicatorProps {
  dotCount?: number;
  color?: string;
  size?: number;
  gap?: number;
  amplitude?: number;
  speed?: number;
  cyclesPerSecond?: number;
  className?: string;
}

export interface TypingDotOptions {
  fps: number;
  dotCount: number;
  amplitude: number;
  speed: number;
  cyclesPerSecond: number;
}

export function typingDotOffset(
  frame: number,
  index: number,
  opts: TypingDotOptions,
): { translateY: number; opacity: number } {
  const cps = opts.cyclesPerSecond <= 0 ? 1 : opts.cyclesPerSecond;
  const periodFrames = opts.fps / cps;
  const stagger = opts.dotCount > 0 ? periodFrames / (opts.dotCount * 2) : 0;
  const phase =
    ((frame * opts.speed - index * stagger) / periodFrames) * Math.PI * 2;
  const wave = (Math.sin(phase) + 1) / 2;
  return {
    translateY: -opts.amplitude * wave,
    opacity: 0.45 + 0.55 * wave,
  };
}

export function TypingIndicator({
  dotCount = 3,
  color = "currentColor",
  size = 8,
  gap = 5,
  amplitude = 5,
  speed = 1,
  cyclesPerSecond = 1.1,
  className,
}: TypingIndicatorProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opts: TypingDotOptions = {
    fps,
    dotCount,
    amplitude,
    speed,
    cyclesPerSecond,
  };

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap,
        height: size + amplitude * 2,
      }}
    >
      {Array.from({ length: dotCount }, (_, i) => {
        const { translateY, opacity } = typingDotOffset(frame, i, opts);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              width: size,
              height: size,
              borderRadius: "50%",
              background: color,
              opacity,
              transform: `translateY(${translateY}px)`,
            }}
          />
        );
      })}
    </div>
  );
}
