"use client";

import { getBoundingBox, getSubpaths } from "@remotion/paths";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type NeonSignProps = {
  /** SVG path data for the tube. Each subpath (M command) flickers on its own. */
  path?: string;
  /** viewBox for the path. Defaults to the path's bounding box. */
  viewBox?: string;
  /** Tube color when lit. */
  color?: string;
  /** Color of the halo and the glow on the wall. */
  glowColor?: string;
  /** Unlit glass tube. */
  tubeColor?: string;
  /** Color of the hot core inside the tube. */
  coreColor?: string;
  backgroundColor?: string;
  /** Tube thickness in path units. */
  strokeWidth?: number;
  /** Share of the frame width the sign spans. */
  fit?: number;
  seed?: number;
  speed?: number;
};

// Handwritten "hello" with an underline swash, one subpath per tube.
const HELLO = [
  "M 30 132 C 52 112 74 70 70 46 C 67 28 50 30 47 52 C 44 76 42 112 40 140 C 46 116 58 100 72 100 C 86 100 84 122 86 134 C 88 144 100 144 110 132",
  "M 110 132 C 124 124 142 110 136 98 C 130 88 112 96 112 116 C 112 138 134 146 156 130",
  "M 156 130 C 176 110 196 66 190 46 C 186 32 170 36 168 60 C 166 90 168 126 172 136 C 176 146 188 142 196 132",
  "M 196 132 C 216 110 232 66 226 46 C 222 32 206 36 204 60 C 202 90 204 126 208 136 C 212 146 224 142 232 132",
  "M 232 132 C 238 116 248 100 262 100 C 278 100 280 124 268 136 C 256 146 242 136 248 118 C 252 106 268 104 290 104",
  "M 52 170 C 120 160 210 162 296 152",
].join(" ");

export const neonSignDefaults = {
  path: HELLO,
  color: "#E5322D",
  glowColor: "#E5322D",
  tubeColor: "#2A2A2A",
  coreColor: "#FFFFFF",
  backgroundColor: "#111111",
  strokeWidth: 6,
  fit: 0.62,
  seed: 7,
  speed: 1,
};

const FIRST = 3;
const STEP = 3.4;
const STUTTER = 7;
// Whole sign drops out once after everything is lit, then holds.
const BUZZ: [number, number][] = [
  [29, 0.1],
  [30, 0],
  [31, 0.55],
  [32, 0.2],
];
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

function segmentLevel(t: number, i: number, seed: number) {
  const onset = FIRST + i * STEP + random(`neon-sign-${seed}-${i}`) * 2;
  if (t < onset) return 0;
  if (t < onset + STUTTER) {
    const tick = Math.floor(t);
    const v = random(`neon-sign-${seed}-${i}-${tick}`);
    const ramp = (t - onset) / STUTTER;
    return v < 0.5 - ramp * 0.3 ? 0.04 : 0.55 + 0.45 * v;
  }
  return 1;
}

export function NeonSign(props: NeonSignProps) {
  const {
    path,
    viewBox,
    color,
    glowColor,
    tubeColor,
    coreColor,
    backgroundColor,
    strokeWidth,
    fit,
    seed,
    speed,
  } = { ...neonSignDefaults, ...props };
  const uid = `neon-sign-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = frame * Math.max(0, speed);

  const segments = useMemo(() => getSubpaths(path), [path]);
  const box = useMemo(() => {
    if (viewBox) {
      const [x, y, w, h] = viewBox.split(/[\s,]+/).map(Number);
      return { x, y, w, h };
    }
    const b = getBoundingBox(path);
    const pad = strokeWidth * 6;
    return {
      x: b.x1 - pad,
      y: b.y1 - pad,
      w: b.width + pad * 2,
      h: b.height + pad * 2,
    };
  }, [path, viewBox, strokeWidth]);

  const tick = Math.floor(t);
  const buzz = BUZZ.find(([f]) => f === tick)?.[1] ?? 1;
  const levels = segments.map((_, i) => segmentLevel(t, i, seed) * buzz);
  const average =
    levels.reduce((a, b) => a + b, 0) / Math.max(1, levels.length);

  const scale = Math.min((width * fit) / box.w, (height * 0.7) / box.h);
  const drawW = box.w * scale;
  const drawH = box.h * scale;
  const settle = interpolate(t, [32, 40], [0.85, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${drawW * 0.75}px ${drawH * 0.85}px at 50% 50%, ${glowColor} 0%, transparent 100%)`,
          opacity: 0.28 * average * settle,
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg
          width={drawW}
          height={drawH}
          viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
          style={{ overflow: "visible" }}
        >
          <defs>
            <filter
              id={`${uid}-wide`}
              filterUnits="userSpaceOnUse"
              x={box.x - box.w}
              y={box.y - box.h}
              width={box.w * 3}
              height={box.h * 3}
            >
              <feGaussianBlur stdDeviation={strokeWidth * 2.2} />
            </filter>
            <filter
              id={`${uid}-near`}
              filterUnits="userSpaceOnUse"
              x={box.x - box.w}
              y={box.y - box.h}
              width={box.w * 3}
              height={box.h * 3}
            >
              <feGaussianBlur stdDeviation={strokeWidth * 0.6} />
            </filter>
          </defs>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {segments.map((d, i) => (
              <path
                key={`tube-${i}`}
                d={d}
                stroke={tubeColor}
                strokeWidth={strokeWidth}
              />
            ))}
            {segments.map((d, i) => {
              const level = levels[i];
              if (level <= 0) return null;
              return (
                <g key={`lit-${i}`}>
                  <path
                    d={d}
                    stroke={glowColor}
                    strokeWidth={strokeWidth * 3}
                    opacity={0.7 * level}
                    filter={`url(#${uid}-wide)`}
                  />
                  <path
                    d={d}
                    stroke={color}
                    strokeWidth={strokeWidth * 1.6}
                    opacity={0.9 * level}
                    filter={`url(#${uid}-near)`}
                  />
                  <path
                    d={d}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    opacity={level}
                  />
                  <path
                    d={d}
                    stroke={coreColor}
                    strokeWidth={strokeWidth * 0.36}
                    opacity={0.9 * level}
                  />
                </g>
              );
            })}
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
