"use client";

import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type LifeGridProps = {
  /** Columns; rows follow the frame aspect ratio. */
  cols?: number;
  /** Share of cells alive in the seeded first generation, 0 to 1. */
  density?: number;
  /** Frames each generation is held. */
  framesPerGeneration?: number;
  /** Gap between tiles, as a fraction of the cell. */
  gap?: number;
  /** Draw the faint lattice of empty cells. */
  showGrid?: boolean;
  seed?: number;
  speed?: number;
  background?: string;
  /** Living cells. */
  color?: string;
  /** Flash color for newborn cells. */
  accent?: string;
};

export const lifeGridDefaults: Required<LifeGridProps> = {
  cols: 48,
  density: 0.24,
  framesPerGeneration: 5,
  gap: 0.16,
  showGrid: true,
  seed: 7,
  speed: 1,
  background: "#111111",
  color: "#FFFFFF",
  accent: "#E5322D",
};

const fmt = (n: number) => Math.round(n * 10) / 10;
const grow = Easing.out(Easing.back(2));
const shrink = Easing.in(Easing.cubic);
const settle = Easing.inOut(Easing.cubic);

// Generations are a pure function of the seed and grid size; computed once and
// shared across frames (and component instances) of a render.
const cache = new Map<string, Uint8Array[]>();

function generations(
  cols: number,
  rows: number,
  density: number,
  seed: number,
  count: number,
) {
  const key = `${cols}x${rows}|${density}|${seed}`;
  const known = cache.get(key);
  if (known && known.length >= count) return known;
  const list: Uint8Array[] = known ?? [];
  if (list.length === 0) {
    const first = new Uint8Array(cols * rows);
    for (let i = 0; i < first.length; i++) {
      first[i] = random(`life-grid-${seed}-${i}`) < density ? 1 : 0;
    }
    list.push(first);
  }
  while (list.length < count) {
    const prev = list[list.length - 1];
    const next = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            // Wrap around the edges (torus) so the board never runs dry at the border.
            const xx = (x + dx + cols) % cols;
            const yy = (y + dy + rows) % rows;
            n += prev[yy * cols + xx];
          }
        }
        const alive = prev[y * cols + x] === 1;
        next[y * cols + x] = n === 3 || (alive && n === 2) ? 1 : 0;
      }
    }
    list.push(next);
  }
  if (cache.size > 16) cache.clear();
  cache.set(key, list);
  return list;
}

export function LifeGrid({
  cols = lifeGridDefaults.cols,
  density = lifeGridDefaults.density,
  framesPerGeneration = lifeGridDefaults.framesPerGeneration,
  gap = lifeGridDefaults.gap,
  showGrid = lifeGridDefaults.showGrid,
  seed = lifeGridDefaults.seed,
  speed = lifeGridDefaults.speed,
  background = lifeGridDefaults.background,
  color = lifeGridDefaults.color,
  accent = lifeGridDefaults.accent,
}: LifeGridProps) {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const nx = Math.max(4, Math.round(cols));
  const ny = Math.max(4, Math.round((nx * height) / width));
  const fpg = Math.max(1, framesPerGeneration);
  const total = Math.ceil((durationInFrames * Math.max(0, speed)) / fpg) + 2;
  const gens = useMemo(
    () => generations(nx, ny, density, seed, total),
    [nx, ny, density, seed, total],
  );

  const cell = Math.min(width / nx, height / ny);
  const ox = (width - cell * nx) / 2;
  const oy = (height - cell * ny) / 2;
  const tile = cell * (1 - gap);

  const time = Math.max(0, frame * speed);
  const g = Math.min(gens.length - 1, Math.floor(time / fpg));
  const local = Math.min(1, (time - g * fpg) / fpg);
  const now = gens[g];
  const before = g > 0 ? gens[g - 1] : now;

  const square = (index: number, size: number) => {
    const x = ox + (index % nx) * cell + (cell - size) / 2;
    const y = oy + Math.floor(index / nx) * cell + (cell - size) / 2;
    const s = fmt(size);
    return `M ${fmt(x)} ${fmt(y)} h ${s} v ${s} h ${-s} Z `;
  };

  const bornSize = tile * (0.35 + 0.65 * grow(local));
  const dyingSize = tile * (1 - shrink(Math.min(1, local * 1.6)));
  let lattice = "";
  let alive = "";
  let fresh = "";
  // Newborns pop in as accent tiles, then a white tile grows from their
  // centre: a crisp flash with no pink cross-fade in between.
  const coreSize =
    tile * settle(Math.min(1, Math.max(0, (local - 0.35) / 0.65)));
  for (let i = 0; i < now.length; i++) {
    if (showGrid) lattice += square(i, tile);
    if (now[i]) {
      if (!before[i] && g > 0) {
        fresh += square(i, bornSize);
        if (coreSize > 0.5) alive += square(i, coreSize);
      } else {
        alive += square(i, tile);
      }
    } else if (before[i] && dyingSize > 0.5) {
      alive += square(i, dyingSize);
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Game of Life grid"
        style={{ display: "block" }}
      >
        {showGrid ? <path d={lattice} fill={color} fillOpacity={0.05} /> : null}
        <path d={fresh} fill={accent} />
        <path d={alive} fill={color} />
      </svg>
    </AbsoluteFill>
  );
}
