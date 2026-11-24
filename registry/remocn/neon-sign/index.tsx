"use client";

import { getBoundingBox, getSubpaths } from "@remotion/paths";
import { useId, useMemo } from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  BUZZ_LEVELS,
  DEFAULT_SEED,
  HELLO,
  type NeonSignElementId,
  neonSignTimeline,
} from "./timeline";

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
  /**
   * Moves, trims or stretches each tube's flicker and the buzz, by the ids
   * in `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<NeonSignElementId>;
};

export const neonSignDefaults = {
  path: HELLO,
  color: "#E5322D",
  glowColor: "#E5322D",
  tubeColor: "#2A2A2A",
  coreColor: "#FFFFFF",
  backgroundColor: "#111111",
  strokeWidth: 6,
  fit: 0.62,
  seed: DEFAULT_SEED,
  speed: 1,
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

function segmentLevel(
  t: number,
  i: number,
  seed: number,
  tube: { start: number; end: number; length: number },
) {
  const onset = tube.start;
  if (t < onset) return 0;
  if (t < tube.end) {
    const tick = Math.floor(t);
    const v = random(`neon-sign-${seed}-${i}-${tick}`);
    const ramp = (t - onset) / tube.length;
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
    timing,
  } = { ...neonSignDefaults, ...props };
  const uid = `neon-sign-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const frame = useSceneFrame();
  const { width, height, durationInFrames } = useSceneConfig();
  const t = frame * Math.max(0, speed);
  const tl = useTimeline(
    neonSignTimeline,
    props,
    durationInFrames * Math.max(0, speed),
    timing,
  );
  const buzzEl = tl.get("buzz");

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

  const pulse = Math.floor((t - buzzEl.start) / buzzEl.beat("pulse"));
  const buzz = BUZZ_LEVELS[pulse] ?? 1;
  const levels = segments.map(
    (_, i) => segmentLevel(t, i, seed, tl.get(`tube:${i}`)) * buzz,
  );
  const average =
    levels.reduce((a, b) => a + b, 0) / Math.max(1, levels.length);

  const scale = Math.min((width * fit) / box.w, (height * 0.7) / box.h);
  const drawW = box.w * scale;
  const drawH = box.h * scale;
  const settle = interpolate(
    t,
    [
      buzzEl.start + buzzEl.beat("settle"),
      buzzEl.start + buzzEl.beat("settleEnd"),
    ],
    [0.85, 1],
    clamp,
  );

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
