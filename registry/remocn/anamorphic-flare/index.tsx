"use client";

import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type AnamorphicFlareProps = {
  /** Lockup revealed behind the streak. Falls back to a placeholder "remocn" lockup. */
  children?: React.ReactNode;
  /** Warm tint of the streak glow and ghosts. */
  tint?: string;
  /** Color of the hot core line. */
  coreColor?: string;
  backgroundColor?: string;
  /** Number of ghost orbs mirrored across the frame center. */
  ghosts?: number;
  /** Vertical position of the streak, 0 to 1. */
  y?: number;
  seed?: number;
  speed?: number;
};

export const anamorphicFlareDefaults = {
  tint: "#E5322D",
  coreColor: "#FFFFFF",
  backgroundColor: "#111111",
  ghosts: 4,
  y: 0.5,
  seed: 2,
  speed: 1,
};

const IGNITE = 6;
const CROSS_START = 4;
const CROSS_END = 26;
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const PLACEHOLDER_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Helvetica, Arial, sans-serif";

// Neutral lockup shown when no children are passed.
function PlaceholderLockup({
  mark,
  dot,
  text,
  scale = 1,
}: {
  mark: string;
  dot: string;
  text: string;
  scale?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 * scale }}>
      <div
        style={{
          width: 120 * scale,
          height: 120 * scale,
          borderRadius: 32 * scale,
          backgroundColor: mark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 36 * scale,
            height: 36 * scale,
            borderRadius: "50%",
            backgroundColor: dot,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: PLACEHOLDER_FONT,
          fontSize: 104 * scale,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: text,
        }}
      >
        remocn
      </span>
    </div>
  );
}

export function AnamorphicFlare(props: AnamorphicFlareProps) {
  const { children, tint, coreColor, backgroundColor, ghosts, y, seed, speed } =
    { ...anamorphicFlareDefaults, ...props };
  const uid = `anamorphic-flare-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame * Math.max(0, speed);
  const cy = y * height;
  const cx = width / 2;

  const head = interpolate(t, [CROSS_START, CROSS_END], [0.07, 1.12], {
    ...clamp,
    easing: Easing.bezier(0.45, 0, 0.4, 1),
  });
  const hx = head * width;
  const ignite = interpolate(t, [0, IGNITE], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const fade = interpolate(t, [CROSS_END - 6, CROSS_END + 2], [1, 0], clamp);
  const power = ignite * fade;
  const streakLen =
    width *
    interpolate(t, [0, 12], [0.04, 1.3], {
      ...clamp,
      easing: Easing.out(Easing.quad),
    });
  const coreH = Math.max(2, height * 0.004);
  const glowH = height * 0.05;
  const residual = interpolate(
    t,
    [CROSS_END - 2, CROSS_END + 14],
    [0, 0.14],
    clamp,
  );
  const soft = width * 0.08;
  const mask = `linear-gradient(90deg, #000 0px, #000 ${hx - soft}px, transparent ${hx}px)`;

  const ghostList = Array.from(
    { length: Math.max(0, Math.round(ghosts)) },
    (_, i) => {
      const k = -1.3 + random(`anamorphic-flare-${seed}-${i}-k`) * 2.2;
      return {
        x: cx - (hx - cx) * k,
        r: height * (0.025 + 0.07 * random(`anamorphic-flare-${seed}-${i}-r`)),
        o: 0.12 + 0.18 * random(`anamorphic-flare-${seed}-${i}-o`),
        dy: (random(`anamorphic-flare-${seed}-${i}-y`) - 0.5) * height * 0.05,
      };
    },
  );

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient id={`${uid}-trail`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={tint} stopOpacity={0} />
            <stop offset="0.5" stopColor={tint} stopOpacity={1} />
            <stop offset="1" stopColor={tint} stopOpacity={0} />
          </linearGradient>
        </defs>
        <rect
          x={0}
          y={cy - 1}
          width={width}
          height={2}
          fill={`url(#${uid}-trail)`}
          opacity={residual}
        />
      </svg>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      >
        {children ?? (
          <PlaceholderLockup
            mark={tint}
            dot={backgroundColor}
            text={coreColor}
          />
        )}
      </AbsoluteFill>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          position: "absolute",
          inset: 0,
          mixBlendMode: "screen",
        }}
      >
        <defs>
          <linearGradient id={`${uid}-core`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={coreColor} stopOpacity={0} />
            <stop offset="0.5" stopColor={coreColor} stopOpacity={1} />
            <stop offset="1" stopColor={coreColor} stopOpacity={0} />
          </linearGradient>
          <radialGradient id={`${uid}-bloom`}>
            <stop offset="0" stopColor={coreColor} stopOpacity={1} />
            <stop offset="0.25" stopColor={tint} stopOpacity={0.7} />
            <stop offset="1" stopColor={tint} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`${uid}-ghost`}>
            <stop offset="0" stopColor={tint} stopOpacity={0.15} />
            <stop offset="0.8" stopColor={tint} stopOpacity={0.5} />
            <stop offset="1" stopColor={tint} stopOpacity={0} />
          </radialGradient>
          <filter
            id={`${uid}-blur`}
            x={-width}
            y={-height}
            width={width * 3}
            height={height * 3}
            filterUnits="userSpaceOnUse"
          >
            <feGaussianBlur stdDeviation={glowH * 0.35} />
          </filter>
        </defs>
        <g opacity={power}>
          <rect
            x={hx - streakLen * 0.45}
            y={cy - glowH / 2}
            width={streakLen * 0.9}
            height={glowH}
            fill={`url(#${uid}-trail)`}
            opacity={0.55}
            filter={`url(#${uid}-blur)`}
          />
          <rect
            x={hx - streakLen / 2}
            y={cy - coreH / 2}
            width={streakLen}
            height={coreH}
            fill={`url(#${uid}-core)`}
          />
          <ellipse
            cx={hx}
            cy={cy}
            rx={height * 0.16}
            ry={height * 0.1}
            fill={`url(#${uid}-bloom)`}
          />
          {ghostList.map((g, i) => (
            <circle
              key={i}
              cx={g.x}
              cy={cy + g.dy}
              r={g.r}
              fill={`url(#${uid}-ghost)`}
              opacity={g.o * 2}
            />
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
}
