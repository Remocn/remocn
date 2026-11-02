"use client";

import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type BrickMosaicProps = {
  /**
   * Pixel art to build. Either rows of characters looked up in `colors`
   * (unknown characters and spaces leave the cell empty) or a 2D grid of CSS
   * colors ("" for empty). Overrides `cols` and `rows`.
   */
  pattern?: string[] | string[][];
  /** Grid size of the default image. */
  cols?: number;
  rows?: number;
  /** Character to color map for string patterns. */
  colors?: Record<string, string>;
  /** Baseplate color behind the bricks. */
  background?: string;
  /** Frames between rows. */
  rowDelay?: number;
  speed?: number;
};

export const brickMosaicDefaults = {
  cols: 24,
  rows: 14,
  colors: {
    "#": "#E5322D",
    ".": "#FFFFFF",
    x: "#111111",
  } as Record<string, string>,
  background: "#111111",
  rowDelay: 3,
  speed: 1,
};

const FALL = 7;
const HOP = 5;
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

function defaultPattern(cols: number, rows: number): string[] {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const r = Math.min(cols, rows) * 0.4;
  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) =>
      Math.hypot(x - cx, y - cy) <= r ? "#" : ".",
    ).join(""),
  );
}

export function getBrickMosaicLength(rows: number, cols: number, rowDelay = 3) {
  return Math.ceil((rows - 1) * rowDelay + cols * 0.12 + 1.5 + FALL + HOP);
}

export function BrickMosaic({
  pattern,
  cols = brickMosaicDefaults.cols,
  rows = brickMosaicDefaults.rows,
  colors = brickMosaicDefaults.colors,
  background = brickMosaicDefaults.background,
  rowDelay = brickMosaicDefaults.rowDelay,
  speed = brickMosaicDefaults.speed,
}: BrickMosaicProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = (frame / fps) * 30 * speed;
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const grid = useMemo(() => {
    const source = pattern ?? defaultPattern(cols, rows);
    return source.map((row) =>
      (typeof row === "string" ? row.split("") : row).map((cell) =>
        typeof row === "string" ? (colors[cell] ?? "") : cell,
      ),
    );
  }, [pattern, cols, rows, colors]);
  const nRows = grid.length;
  const nCols = Math.max(1, ...grid.map((row) => row.length));
  const s = Math.min((W * 0.86) / nCols, (H * 0.86) / nRows);
  const ox = (W - s * nCols) / 2;
  const oy = (H - s * nRows) / 2;
  const gap = s * 0.04;
  const bevel = s * 0.09;
  const stud = s * 0.28;

  const bricks = grid.flatMap((row, r) =>
    row.map((color, col) => {
      if (!color) return null;
      const fromBottom = nRows - 1 - r;
      const start =
        fromBottom * rowDelay + col * 0.12 + random(`brick-${r}-${col}`) * 1.5;
      const local = t - start;
      if (local < 0) return null;
      let y = 0;
      if (local < FALL) {
        const p = local / FALL;
        y = -s * 1.8 * (1 - p * p);
      } else if (local < FALL + HOP) {
        const p = (local - FALL) / HOP;
        y = -s * 0.12 * 4 * p * (1 - p);
      }
      const opacity = interpolate(local, [0, 2], [0, 1], clamp);
      const x0 = ox + col * s + gap / 2;
      const y0 = oy + r * s + gap / 2 + y;
      const b = s - gap;
      return (
        <g
          key={`${r}-${col}`}
          transform={`translate(${x0} ${y0})`}
          opacity={opacity}
        >
          <rect width={b} height={b} rx={s * 0.06} fill={color} />
          <path
            d={`M 0 ${b} V 0 H ${b} L ${b - bevel} ${bevel} H ${bevel} V ${b - bevel} Z`}
            fill="#FFFFFF"
            opacity={0.22}
          />
          <path
            d={`M ${b} 0 V ${b} H 0 L ${bevel} ${b - bevel} H ${b - bevel} V ${bevel} Z`}
            fill="#000000"
            opacity={0.22}
          />
          <circle
            cx={b / 2 + s * 0.035}
            cy={b / 2 + s * 0.05}
            r={stud}
            fill="#000000"
            opacity={0.28}
          />
          <circle cx={b / 2} cy={b / 2} r={stud} fill={color} />
          <circle cx={b / 2} cy={b / 2} r={stud} fill={`url(#${id}-stud)`} />
        </g>
      );
    }),
  );

  const landed = interpolate(t, [0, 10], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: background, overflow: "hidden" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
        <defs>
          <linearGradient
            id={`${id}-stud`}
            x1="0.15"
            y1="0.1"
            x2="0.85"
            y2="0.9"
          >
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
            <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset="1" stopColor="#000000" stopOpacity={0.22} />
          </linearGradient>
        </defs>
        {/* Baseplate studs the bricks snap onto. */}
        <g fill="#FFFFFF" opacity={0.07 * landed}>
          {grid.flatMap((row, r) =>
            row.map((_, col) => (
              <circle
                key={`${r}-${col}`}
                cx={ox + (col + 0.5) * s}
                cy={oy + (r + 0.5) * s}
                r={stud}
              />
            )),
          )}
        </g>
        {bricks}
      </svg>
    </AbsoluteFill>
  );
}
