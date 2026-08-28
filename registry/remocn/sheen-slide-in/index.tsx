"use client";

import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface SheenSlideInProps {
  text: string;
  exitAt?: number;
  fontSize?: number;
  baseColor?: string;
  sheenColor?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
}

const SETTLE_AMP_EM = 1.8;
const SETTLE_TAU = 2.5;
const CREEP_AMP_EM = 0.28;
const CREEP_TAU = 12;
const FADE_FRAMES = 4;
const SHEEN_IN_START = 0;
const SHEEN_IN_END = 4;
const SHEEN_SWEEP_END = 48;
const SHEEN_OUT_START = 48;
const SHEEN_OUT_END = 58;
const EXIT_FRAMES = 4;
const EXIT_SCALE = 0.9;

export function sheenSlideInLength(exitAt = 60): number {
  return exitAt + EXIT_FRAMES;
}

function travelEm(frame: number): number {
  return (
    SETTLE_AMP_EM * Math.exp(-frame / SETTLE_TAU) +
    CREEP_AMP_EM * Math.exp(-frame / CREEP_TAU)
  );
}

const exitEasing = Easing.out(Easing.quad);

export function SheenSlideIn({
  text,
  exitAt = 60,
  fontSize = 72,
  baseColor = "#18181b",
  sheenColor = "#4f8ef7",
  fontWeight = 400,
  speed = 1,
  className,
}: SheenSlideInProps) {
  const frame = useCurrentFrame() * speed;

  const x = fontSize * travelEm(frame);

  const exit = interpolate(frame, [exitAt, exitAt + EXIT_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: exitEasing,
  });

  const opacity = interpolate(frame, [0, FADE_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sheenOpacity =
    interpolate(frame, [SHEEN_IN_START, SHEEN_IN_END], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(frame, [SHEEN_OUT_START, SHEEN_OUT_END], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const sheenPosition = interpolate(frame, [0, SHEEN_SWEEP_END], [160, -60], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.42, 0, 0.58, 1),
  });

  const textStyle: React.CSSProperties = {
    fontSize,
    fontWeight,
    letterSpacing: "-0.02em",
    lineHeight: 1.1,
    margin: 0,
    fontFamily:
      "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
  };

  if (exit >= 1) {
    return (
      <div
        style={{ position: "absolute", inset: 0, background: "transparent" }}
      />
    );
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
        background: "transparent",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "inline-block",
          opacity,
          translate: `${x}px 0`,
          scale: `${1 - (1 - EXIT_SCALE) * exit}`,
        }}
      >
        <span className={className} style={{ ...textStyle, color: baseColor }}>
          {text}
        </span>
        <span
          aria-hidden
          style={{
            ...textStyle,
            position: "absolute",
            inset: 0,
            color: "transparent",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            backgroundImage: `linear-gradient(100deg, transparent 25%, ${sheenColor} 50%, transparent 75%)`,
            backgroundSize: "250% 100%",
            backgroundPosition: `${sheenPosition}% 50%`,
            opacity: sheenOpacity,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}
