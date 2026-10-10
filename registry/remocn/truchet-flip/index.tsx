"use client";

import { useMemo } from "react";
import { random, useCurrentFrame, useVideoConfig } from "remotion";

export type TruchetFlipWaveMode = "radial" | "diagonal" | "random";
export type TruchetFlipResolve = "rings" | "field" | "silhouette";
export type TruchetFlipVariant = "stroke" | "filled";
export type TruchetFlipOrientation = 0 | 1;

export interface TruchetFlipProps {
  tiles?: number;
  weight?: number;
  passes?: number;
  waveMode?: TruchetFlipWaveMode;
  resolve?: TruchetFlipResolve;
  variant?: TruchetFlipVariant;
  color?: string;
  secondaryColor?: string;
  seed?: number;
  speed?: number;
  loop?: boolean;
  className?: string;
}

type Paint = "color" | "secondaryColor" | "className";
type Unset = "secondaryColor" | "className";

export interface TruchetFlipOptions extends Omit<TruchetFlipProps, Paint> {
  width?: number;
  height?: number;
  fps?: number;
}

export interface TruchetFlipTile {
  col: number;
  row: number;
  x: number;
  y: number;
  alternate: boolean;
  initial: TruchetFlipOrientation;
  target: TruchetFlipOrientation;
  delay: number;
}

export const truchetFlipDefaults: Required<Omit<TruchetFlipProps, Unset>> = {
  tiles: 10,
  weight: 0.2,
  passes: 2,
  waveMode: "radial",
  resolve: "rings",
  variant: "stroke",
  color: "#ffffff",
  seed: 1,
  speed: 1,
  loop: false,
};

const LEAD = 6;
const SPREAD = 30;
const SNAP = 12;
const SNAP_SETTLE = 8;
const SNAP_RISE = 4;
const SNAP_DAMPING = 0.65;
const GAP = 24;
const RESOLVE_GAP = 30;
const HOLD = 18;
const LOOP_HOLD = 24;
const MAX_PASSES = 4;
const MIN_TILES = 4;
const MAX_TILES = 24;
const MIN_WEIGHT = 0.04;
const MAX_WEIGHT = 0.34;
const SILHOUETTE = 0.38;
const OVERLAP = 0.75;
const SNAP_FREQUENCY = (Math.PI - Math.acos(SNAP_DAMPING)) / SNAP_RISE;
const SNAP_RATIO = SNAP_DAMPING / Math.sqrt(1 - SNAP_DAMPING ** 2);

const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 1000) / 1000;
const isOdd = (value: number) => Math.abs(value % 2) === 1;
const turn = (wave: number) => (wave % 2 === 0 ? 1 : -1);
const rateOf = (speed: number | undefined) =>
  Math.max(0, finite(speed, truchetFlipDefaults.speed));
const waveOf = (value: string | undefined): TruchetFlipWaveMode =>
  value === "diagonal" || value === "random" ? value : "radial";
const resolveOf = (value: string | undefined): TruchetFlipResolve =>
  value === "field" || value === "silhouette" ? value : "rings";
const variantOf = (value: string | undefined): TruchetFlipVariant =>
  value === "filled" ? value : "stroke";

function smoothstep(value: number) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function mazeKey(seed: number, col: number, row: number) {
  return random(`truchet-flip-${seed}-${col}-${row}`);
}

function waveKey(seed: number, col: number, row: number) {
  return random(`truchet-flip-${seed}-wave-${col}-${row}`);
}

export function getTruchetFlipSnap(frames: number) {
  if (Number.isNaN(frames) || frames <= 0) return 0;
  if (frames >= SNAP) return 1;
  const phase = SNAP_FREQUENCY * frames;
  const decay = Math.exp(-SNAP_RATIO * phase);
  const ring = decay * (Math.cos(phase) + SNAP_RATIO * Math.sin(phase));
  const settle = smoothstep((frames - SNAP_SETTLE) / (SNAP - SNAP_SETTLE));
  return 1 - ring * (1 - settle);
}

export function getTruchetFlipTimeline(options: TruchetFlipOptions = {}) {
  const requested = finite(options.passes, truchetFlipDefaults.passes);
  const passes = Math.round(clamp(requested, 0, MAX_PASSES));
  const starts = Array.from({ length: passes }, (_, i) => LEAD + i * GAP);
  const lastPass = LEAD + Math.max(0, passes - 1) * GAP;
  const resolveStart = passes === 0 ? LEAD : lastPass + RESOLVE_GAP;
  const settled = resolveStart + SPREAD + SNAP;
  const returnStart = settled + LOOP_HOLD;
  const loop = options.loop === true;
  const duration = loop ? returnStart + SPREAD + SNAP : settled + HOLD;
  return {
    passes,
    starts,
    resolveStart,
    settled,
    returnStart,
    loop,
    duration,
  };
}

export type TruchetFlipTimeline = ReturnType<typeof getTruchetFlipTimeline>;

export const truchetFlipLength = getTruchetFlipTimeline().settled;

export function getTruchetFlipDuration(options: TruchetFlipOptions = {}) {
  const rate = rateOf(options.speed);
  const { duration } = getTruchetFlipTimeline(options);
  return rate === 0 ? 1 : Math.max(1, Math.ceil(duration / rate));
}

export function getTruchetFlipTime(
  frame: number,
  options: TruchetFlipOptions = {},
) {
  const scale = 30 / Math.max(1, finite(options.fps, 30));
  const time = Math.max(0, finite(frame, 0)) * scale * rateOf(options.speed);
  const { duration, loop } = getTruchetFlipTimeline(options);
  return loop ? time % duration : time;
}

export function getTruchetFlipTarget(
  resolve: TruchetFlipResolve,
  col: number,
  row: number,
  tiles = truchetFlipDefaults.tiles,
): TruchetFlipOrientation {
  if (resolve === "field") return 0;
  if (resolve === "silhouette") {
    const inside = Math.hypot(col + 0.5, row + 0.5) < tiles * SILHOUETTE;
    return inside && isOdd(col + row) ? 1 : 0;
  }
  const left = col < 0;
  const above = row < 0;
  return left === above ? 0 : 1;
}

export function getTruchetFlipGrid(options: TruchetFlipOptions = {}) {
  const width = Math.max(1, finite(options.width, 1280));
  const height = Math.max(1, finite(options.height, 720));
  const requested = finite(options.tiles, truchetFlipDefaults.tiles);
  const count = Math.round(clamp(requested, MIN_TILES, MAX_TILES));
  const size = Math.min(width, height) / count;
  const halfCols = Math.ceil(width / 2 / size - 1e-6);
  const halfRows = Math.ceil(height / 2 / size - 1e-6);
  const seed = finite(options.seed, truchetFlipDefaults.seed);
  const mode = waveOf(options.waveMode);
  const resolve = resolveOf(options.resolve);
  const cells: { col: number; row: number }[] = [];
  for (let row = -halfRows; row < halfRows; row++) {
    for (let col = -halfCols; col < halfCols; col++) cells.push({ col, row });
  }
  const ranks: number[] = [];
  if (mode === "random") {
    const keys = cells.map(({ col, row }) => waveKey(seed, col, row));
    const order = keys.map((_, index) => index);
    order.sort((a, b) => keys[a] - keys[b]);
    for (const [position, index] of order.entries()) ranks[index] = position;
  }
  const shift = halfCols + halfRows;
  const diagonals = 2 * (shift - 1);
  const nearest = Math.hypot(0.5, 0.5);
  const farthest = Math.hypot(halfCols - 0.5, halfRows - 0.5);
  const delayOf = (col: number, row: number, index: number) => {
    if (mode === "random") {
      return (SPREAD * ranks[index]) / (cells.length - 1);
    }
    if (mode === "diagonal") {
      return (SPREAD * (col + row + shift)) / diagonals;
    }
    const distance = Math.hypot(col + 0.5, row + 0.5) - nearest;
    return (SPREAD * distance) / Math.max(1e-6, farthest - nearest);
  };
  const tiles: TruchetFlipTile[] = cells.map(({ col, row }, index) => ({
    col,
    row,
    x: round(width / 2 + (col + 0.5) * size),
    y: round(height / 2 + (row + 0.5) * size),
    alternate: isOdd(col + row),
    initial: mazeKey(seed, col, row) < 0.5 ? 0 : 1,
    target: getTruchetFlipTarget(resolve, col, row, count),
    delay: round(clamp(delayOf(col, row, index), 0, SPREAD)),
  }));
  return {
    width,
    height,
    count,
    size,
    unit: Math.min(width, height) / 720,
    tiles,
  };
}

export type TruchetFlipGrid = ReturnType<typeof getTruchetFlipGrid>;

export function getTruchetFlipAngle(
  tile: TruchetFlipTile,
  time: number,
  timeline: TruchetFlipTimeline,
) {
  let turns = 0;
  for (const [wave, start] of timeline.starts.entries()) {
    turns += turn(wave) * getTruchetFlipSnap(time - start - tile.delay);
  }
  const reached = (tile.initial + timeline.passes) % 2;
  if (reached !== tile.target) {
    const since = time - timeline.resolveStart - tile.delay;
    turns += turn(timeline.passes) * getTruchetFlipSnap(since);
  }
  if (timeline.loop && tile.target !== tile.initial) {
    const since = time - timeline.returnStart - tile.delay;
    turns += turn(timeline.passes + 1) * getTruchetFlipSnap(since);
  }
  return (tile.initial + turns) * 90;
}

export function getTruchetFlipTilePath(
  size: number,
  variant: TruchetFlipVariant = "stroke",
  overlap = OVERLAP,
) {
  const half = Math.max(0, finite(size, 0)) / 2;
  const pad = clamp(finite(overlap, OVERLAP), 0, half / 4);
  const radius = `${round(half)} ${round(half)}`;
  const point = (x: number, y: number) => `${round(x)} ${round(y)}`;
  if (variant === "filled") {
    const reach = Math.sqrt(half * half - pad * pad);
    const sector = (cx: number, cy: number, side: number) => {
      const corner = point(cx - side * pad, cy - side * pad);
      const start = point(cx + side * reach, cy - side * pad);
      const end = point(cx - side * pad, cy + side * reach);
      return `M ${corner} L ${start} A ${radius} 0 0 1 ${end} Z`;
    };
    return `${sector(-half, -half, 1)} ${sector(half, half, -1)}`;
  }
  const bend = half > 0 ? pad / half : 0;
  const cos = half * Math.cos(bend);
  const sin = half * Math.sin(bend);
  const arc = (cx: number, cy: number, side: number) => {
    const start = point(cx + side * cos, cy - side * sin);
    const end = point(cx - side * sin, cy + side * cos);
    return `M ${start} A ${radius} 0 0 1 ${end}`;
  };
  return `${arc(-half, -half, 1)} ${arc(half, half, -1)}`;
}

export function getTruchetFlipState(
  frame: number,
  options: TruchetFlipOptions = {},
  grid: TruchetFlipGrid = getTruchetFlipGrid(options),
) {
  const timeline = getTruchetFlipTimeline(options);
  const time = getTruchetFlipTime(frame, options);
  const variant = variantOf(options.variant);
  const requested = finite(options.weight, truchetFlipDefaults.weight);
  const weight = clamp(requested, MIN_WEIGHT, MAX_WEIGHT);
  return {
    ...grid,
    time,
    timeline,
    variant,
    strokeWidth: round(grid.size * weight),
    path: getTruchetFlipTilePath(grid.size, variant, OVERLAP * grid.unit),
    tiles: grid.tiles.map((tile) => {
      const angle = getTruchetFlipAngle(tile, time, timeline);
      const rotation = round(angle);
      const transform = `translate(${tile.x} ${tile.y}) rotate(${rotation})`;
      return { ...tile, angle, transform };
    }),
  };
}

export function TruchetFlip({
  tiles = truchetFlipDefaults.tiles,
  weight = truchetFlipDefaults.weight,
  passes = truchetFlipDefaults.passes,
  waveMode = truchetFlipDefaults.waveMode,
  resolve = truchetFlipDefaults.resolve,
  variant = truchetFlipDefaults.variant,
  color = truchetFlipDefaults.color,
  secondaryColor,
  seed = truchetFlipDefaults.seed,
  speed = truchetFlipDefaults.speed,
  loop = truchetFlipDefaults.loop,
  className,
}: TruchetFlipProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const grid = useMemo(() => {
    const layout = { width, height, tiles, seed, waveMode, resolve };
    return getTruchetFlipGrid(layout);
  }, [width, height, tiles, seed, waveMode, resolve]);
  const motion = { fps, weight, passes, variant, speed, loop };
  const state = getTruchetFlipState(frame, motion, grid);
  const filled = state.variant === "filled";
  const primary = state.tiles.filter((tile) => !tile.alternate);
  const alternate = state.tiles.filter((tile) => tile.alternate);
  const layers = [
    { key: "primary", paint: color, tiles: primary },
    { key: "alternate", paint: secondaryColor ?? color, tiles: alternate },
  ];

  return (
    <div
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Truchet tile pattern"
        style={{ display: "block" }}
      >
        {layers.map((layer) => (
          <g
            key={layer.key}
            fill={filled ? layer.paint : "none"}
            stroke={filled ? "none" : layer.paint}
            strokeWidth={filled ? undefined : state.strokeWidth}
          >
            {layer.tiles.map((tile) => (
              <path
                key={`${tile.col}:${tile.row}`}
                d={state.path}
                transform={tile.transform}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
