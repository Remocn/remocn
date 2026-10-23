"use client";

import { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type IsometricBuildProps = {
  /** Tiles per side. */
  grid?: number;
  /** Tallest regular block, in tile widths. The accent tower rises above it. */
  maxHeight?: number;
  /** Frames between consecutive diagonals rising. */
  stagger?: number;
  seed?: number;
  speed?: number;
  background?: string;
  /** Block color; side faces are this color shaded toward the background. */
  color?: string;
  /** The single accent tower. */
  accent?: string;
  /** Draw floor lines on the block faces. */
  floors?: boolean;
  /** Gap between neighbouring blocks, as a share of a tile. */
  gap?: number;
};

export const isometricBuildDefaults: Required<IsometricBuildProps> = {
  grid: 5,
  maxHeight: 2.2,
  stagger: 2,
  seed: 4,
  speed: 1,
  background: "#111111",
  color: "#FFFFFF",
  accent: "#E5322D",
  floors: true,
  gap: 0.04,
};

// True isometric: tile half-height = half-width · tan 30°, unit vertical edge
// matches the projected tile edge.
const ISO_Y = Math.tan(Math.PI / 6);
const ISO_Z = 1 / Math.cos(Math.PI / 6);
const FLOOR = 0.42;
const SHADE_LEFT = 0.32;
const SHADE_RIGHT = 0.6;

const fmt = (n: number) => Math.round(n * 10) / 10;

type Block = {
  i: number;
  j: number;
  height: number;
  accent: boolean;
  delay: number;
};

function makeBlocks(
  n: number,
  maxHeight: number,
  seed: number,
  stagger: number,
) {
  const r = (key: string) => random(`isometric-build-${seed}-${key}`);
  const inner = Math.max(1, n - 2);
  const ai = n > 2 ? 1 + Math.floor(r("ai") * inner) : 0;
  const aj = n > 2 ? 1 + Math.floor(r("aj") * inner) : 0;
  const blocks: Block[] = [];
  // Painter order: back (i + j small) to front.
  for (let sum = 0; sum <= 2 * (n - 1); sum++) {
    for (let i = 0; i < n; i++) {
      const j = sum - i;
      if (j < 0 || j >= n) continue;
      const accent = i === ai && j === aj;
      // One compact mass: heights follow a mound that peaks in the middle,
      // with a little seeded variation, snapped to whole floors so the
      // blocks stack like a single stepped sculpture rather than noise.
      const c = (n - 1) / 2;
      const centre = 1 - Math.hypot(i - c, j - c) / (Math.hypot(c, c) || 1);
      const raw =
        maxHeight *
        (0.2 + 0.8 * centre ** 1.3) *
        (0.75 + 0.5 * r(`h${i}-${j}`));
      const h = Math.max(FLOOR, Math.round(raw / FLOOR) * FLOOR);
      blocks.push({
        i,
        j,
        accent,
        height: accent ? maxHeight * 1.35 : h,
        // Front rows rise first.
        delay: (2 * (n - 1) - sum) * stagger + r(`d${i}-${j}`) * stagger,
      });
    }
  }
  return blocks;
}

export function IsometricBuild({
  grid = isometricBuildDefaults.grid,
  maxHeight = isometricBuildDefaults.maxHeight,
  stagger = isometricBuildDefaults.stagger,
  seed = isometricBuildDefaults.seed,
  speed = isometricBuildDefaults.speed,
  background = isometricBuildDefaults.background,
  color = isometricBuildDefaults.color,
  accent = isometricBuildDefaults.accent,
  floors = isometricBuildDefaults.floors,
  gap = isometricBuildDefaults.gap,
}: IsometricBuildProps) {
  const inset = Math.min(0.45, Math.max(0, gap)) / 2;
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const n = Math.max(1, Math.round(grid));
  const blocks = useMemo(
    () => makeBlocks(n, maxHeight, seed, stagger),
    [n, maxHeight, seed, stagger],
  );

  const tallest = maxHeight * 1.35;
  // Fit the diamond plus the tallest tower into the frame.
  const a = Math.min(
    (width * 0.64) / (2 * n),
    (height * 0.8) / (2 * n * ISO_Y + tallest * ISO_Z),
  );
  const b = a * ISO_Y;
  const hz = a * ISO_Z;
  const top = (height - (2 * n * b + tallest * hz)) / 2 + tallest * hz;
  const cx = width / 2;
  const P = (u: number, v: number, z: number) =>
    `${fmt(cx + (u - v) * a)} ${fmt(top + (u + v) * b - z * hz)}`;
  const poly = (...pts: string[]) => `M ${pts.join(" L ")} Z`;

  const unit = Math.min(width, height) / 720;
  const time = frame * speed;

  let ground = "";
  for (let k = 0; k <= n; k++) {
    ground += `M ${P(k, 0, 0)} L ${P(k, n, 0)} M ${P(0, k, 0)} L ${P(n, k, 0)} `;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Isometric city build"
        style={{ display: "block" }}
      >
        <path
          d={ground}
          fill="none"
          stroke={color}
          strokeOpacity={0.12}
          strokeWidth={unit}
        />
        {blocks.map((block) => {
          const s = spring({
            frame: time - block.delay,
            fps,
            config: { damping: 11, stiffness: 140, mass: 0.7 },
          });
          const opacity = interpolate(s, [0, 0.15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          if (opacity <= 0) return null;
          const h = Math.max(0.02, block.height * s);
          const u0 = block.i + inset;
          const u1 = block.i + 1 - inset;
          const v0 = block.j + inset;
          const v1 = block.j + 1 - inset;
          const fill = block.accent ? accent : color;
          const left = poly(
            P(u0, v1, 0),
            P(u1, v1, 0),
            P(u1, v1, h),
            P(u0, v1, h),
          );
          const right = poly(
            P(u1, v0, 0),
            P(u1, v1, 0),
            P(u1, v1, h),
            P(u1, v0, h),
          );
          const roof = poly(
            P(u0, v0, h),
            P(u1, v0, h),
            P(u1, v1, h),
            P(u0, v1, h),
          );
          let lines = "";
          if (floors) {
            for (let z = FLOOR; z < h - FLOOR * 0.5; z += FLOOR) {
              lines += `M ${P(u0, v1, z)} L ${P(u1, v1, z)} L ${P(u1, v0, z)} `;
            }
          }
          return (
            <g key={`${block.i}-${block.j}`} opacity={opacity}>
              <path d={left} fill={fill} />
              <path d={left} fill={background} fillOpacity={SHADE_LEFT} />
              <path d={right} fill={fill} />
              <path d={right} fill={background} fillOpacity={SHADE_RIGHT} />
              {lines ? (
                <path
                  d={lines}
                  fill="none"
                  stroke={background}
                  strokeOpacity={0.35}
                  strokeWidth={unit * 1.2}
                />
              ) : null}
              <path
                d={roof}
                fill={fill}
                stroke={background}
                strokeOpacity={0.5}
                strokeWidth={unit}
                strokeLinejoin="round"
              />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
}
