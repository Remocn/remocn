"use client";

import { Easing, random, useCurrentFrame, useVideoConfig } from "remotion";

export type BauhausShape =
  | "circle"
  | "square"
  | "semicircle"
  | "quarter"
  | "bar";

export type BauhausRole = "ink" | "accent" | "secondary" | "tertiary";

export type TumbleDirection = "U" | "D" | "L" | "R";

export type TumbleMove = `${TumbleDirection}${"+" | "-"}`;

export interface BauhausPose {
  turn: number;
  x: number;
  y: number;
}

export interface BauhausPoint {
  x: number;
  y: number;
}

export interface BauhausFootprint {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface BauhausPiece {
  id: string;
  shape: BauhausShape;
  width: number;
  height: number;
  role: BauhausRole;
  slot: BauhausPose;
  enter: readonly TumbleMove[];
  rebuild: readonly TumbleMove[];
  cue: number;
  after: readonly string[];
}

export interface BauhausStep {
  move: TumbleMove;
  from: BauhausPose;
  to: BauhausPose;
  pivot: BauhausPoint;
  spin: 1 | -1;
}

export interface BauhausFrame {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  pivot: BauhausPoint | null;
}

export interface BauhausPieceFrame extends BauhausFrame {
  id: string;
  shape: BauhausShape;
  role: BauhausRole;
  width: number;
  height: number;
  visible: boolean;
}

export interface BauhausBuildProps {
  scale?: number;
  seed?: number;
  inkColor?: string;
  accentColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  speed?: number;
  loop?: boolean;
  className?: string;
}

interface TumbleRule {
  direction: TumbleDirection;
  spin: 1 | -1;
  reverse: TumbleMove;
}

export const bauhausBuildDefaults = {
  scale: 1,
  seed: 1,
  inkColor: "#1c1a17",
  accentColor: "#e4572e",
  secondaryColor: "#cbbc9f",
  tertiaryColor: "#7e776b",
  speed: 1,
  loop: false,
};

export const bauhausBuildGrid = 12;
export const bauhausBuildBand = { top: 4, bottom: 8 };
export const bauhausBuildLength = 125;
export const bauhausBuildTimeline = {
  lead: 22,
  beat: 6,
  rebuild: 90,
  clear: 116,
  duration: 150,
};

export const bauhausBuildPieces: readonly BauhausPiece[] = [
  {
    id: "hill",
    shape: "quarter",
    width: 4,
    height: 4,
    role: "ink",
    slot: { turn: 3, x: 0, y: 4 },
    enter: ["D-", "R+"],
    rebuild: ["D-"],
    cue: 0,
    after: ["tile"],
  },
  {
    id: "tile",
    shape: "square",
    width: 1,
    height: 1,
    role: "accent",
    slot: { turn: 0, x: 4, y: 7 },
    enter: ["U+", "U+", "U+", "U+"],
    rebuild: ["D+"],
    cue: 3,
    after: ["pillar"],
  },
  {
    id: "pillar",
    shape: "bar",
    width: 4,
    height: 1,
    role: "ink",
    slot: { turn: 1, x: 5, y: 4 },
    enter: ["R+", "R+"],
    rebuild: ["U+"],
    cue: 6,
    after: ["sun"],
  },
  {
    id: "sun",
    shape: "circle",
    width: 4,
    height: 4,
    role: "accent",
    slot: { turn: 0, x: 6, y: 4 },
    enter: ["U+", "U+"],
    rebuild: ["U-"],
    cue: 9,
    after: [],
  },
  {
    id: "dome",
    shape: "semicircle",
    width: 2,
    height: 2,
    role: "secondary",
    slot: { turn: 3, x: 1, y: 1 },
    enter: ["R+", "D-"],
    rebuild: ["R+"],
    cue: 12,
    after: ["pillar"],
  },
  {
    id: "post",
    shape: "bar",
    width: 4,
    height: 1,
    role: "tertiary",
    slot: { turn: 1, x: 11, y: 4 },
    enter: ["D+", "D+"],
    rebuild: ["D-"],
    cue: 15,
    after: [],
  },
  {
    id: "dot",
    shape: "circle",
    width: 1,
    height: 1,
    role: "ink",
    slot: { turn: 0, x: 11, y: 3 },
    enter: ["D-", "D-", "D-", "D-"],
    rebuild: ["L-"],
    cue: 18,
    after: ["post"],
  },
  {
    id: "block",
    shape: "square",
    width: 2,
    height: 2,
    role: "tertiary",
    slot: { turn: 0, x: 6, y: 10 },
    enter: ["U+", "U+", "U+"],
    rebuild: ["L+"],
    cue: 21,
    after: ["sun"],
  },
  {
    id: "fan",
    shape: "quarter",
    width: 2,
    height: 2,
    role: "secondary",
    slot: { turn: 2, x: 8, y: 10 },
    enter: ["L-", "L+", "L+"],
    rebuild: ["R+"],
    cue: 24,
    after: ["block"],
  },
];

const TURN = 5;
const FILL = 0.8;
const OVERSHOOT = 0.05;
const SETTLE = 0.5;

const MOVES: Record<TumbleMove, TumbleRule> = {
  "U+": { direction: "U", spin: 1, reverse: "D-" },
  "U-": { direction: "U", spin: -1, reverse: "D+" },
  "D+": { direction: "D", spin: 1, reverse: "U-" },
  "D-": { direction: "D", spin: -1, reverse: "U+" },
  "L+": { direction: "L", spin: 1, reverse: "R-" },
  "L-": { direction: "L", spin: -1, reverse: "R+" },
  "R+": { direction: "R", spin: 1, reverse: "L-" },
  "R-": { direction: "R", spin: -1, reverse: "L+" },
};

const finite = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
const swing = Easing.bezier(0.62, 0, 0.3, 1);
const settle = Easing.bezier(0.45, 0, 0.55, 1);

function seedKey(seed: number) {
  return Number.isFinite(seed) ? Math.round(seed) : 1;
}

export function getBauhausFootprint(
  piece: Pick<BauhausPiece, "width" | "height">,
  pose: BauhausPose,
): BauhausFootprint {
  const odd = pose.turn % 2 !== 0;
  return {
    x0: pose.x,
    y0: pose.y,
    x1: pose.x + (odd ? piece.height : piece.width),
    y1: pose.y + (odd ? piece.width : piece.height),
  };
}

export function getTumblePivot(
  box: BauhausFootprint,
  move: TumbleMove,
): BauhausPoint {
  const { direction, spin } = MOVES[move];
  const clockwise = spin === 1;
  switch (direction) {
    case "R":
      return { x: box.x1, y: clockwise ? box.y1 : box.y0 };
    case "L":
      return { x: box.x0, y: clockwise ? box.y0 : box.y1 };
    case "D":
      return { x: clockwise ? box.x0 : box.x1, y: box.y1 };
    default:
      return { x: clockwise ? box.x1 : box.x0, y: box.y0 };
  }
}

const quarterTurn = (
  point: BauhausPoint,
  pivot: BauhausPoint,
  spin: 1 | -1,
): BauhausPoint => ({
  x: pivot.x - spin * (point.y - pivot.y),
  y: pivot.y + spin * (point.x - pivot.x),
});

export function tumble(
  piece: Pick<BauhausPiece, "width" | "height">,
  pose: BauhausPose,
  move: TumbleMove,
): BauhausStep {
  const { spin } = MOVES[move];
  const box = getBauhausFootprint(piece, pose);
  const pivot = getTumblePivot(box, move);
  const a = quarterTurn({ x: box.x0, y: box.y0 }, pivot, spin);
  const b = quarterTurn({ x: box.x1, y: box.y1 }, pivot, spin);
  return {
    move,
    from: pose,
    to: {
      turn: (pose.turn + spin + 4) % 4,
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
    },
    pivot,
    spin,
  };
}

export function getBauhausPaths(piece: BauhausPiece) {
  const walk = (from: BauhausPose, moves: readonly TumbleMove[]) => {
    const steps: BauhausStep[] = [];
    let pose = from;
    for (const move of moves) {
      const step = tumble(piece, pose, move);
      steps.push(step);
      pose = step.to;
    }
    return steps;
  };
  let start = piece.slot;
  for (let index = piece.enter.length - 1; index >= 0; index--) {
    start = tumble(piece, start, MOVES[piece.enter[index]].reverse).to;
  }
  const rebuild = walk(piece.slot, piece.rebuild);
  return {
    start,
    enter: walk(start, piece.enter),
    rebuild,
    handoff: rebuild.at(-1)?.to ?? piece.slot,
  };
}

function getRestOffset(
  piece: Pick<BauhausPiece, "width" | "height">,
  turn: number,
): BauhausPoint {
  switch (turn) {
    case 1:
      return { x: piece.height, y: 0 };
    case 2:
      return { x: piece.width, y: piece.height };
    case 3:
      return { x: 0, y: piece.width };
    default:
      return { x: 0, y: 0 };
  }
}

export function getBauhausPoseFrame(
  piece: Pick<BauhausPiece, "width" | "height">,
  pose: BauhausPose,
): BauhausFrame {
  const offset = getRestOffset(piece, pose.turn);
  return {
    x: pose.x + offset.x,
    y: pose.y + offset.y,
    rotation: pose.turn * 90,
    scale: 1,
    pivot: null,
  };
}

export function getBauhausStepFrame(
  piece: Pick<BauhausPiece, "width" | "height">,
  step: BauhausStep,
  progress: number,
  grow = 1,
): BauhausFrame {
  const rest = getBauhausPoseFrame(piece, step.from);
  const angle = (step.spin * progress * Math.PI) / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = rest.x - step.pivot.x;
  const dy = rest.y - step.pivot.y;
  return {
    x: step.pivot.x + grow * (dx * cos - dy * sin),
    y: step.pivot.y + grow * (dx * sin + dy * cos),
    rotation: rest.rotation + step.spin * progress * 90,
    scale: grow,
    pivot: step.pivot,
  };
}

export function getTumbleDuration(
  piece: Pick<BauhausPiece, "width" | "height">,
) {
  return TURN * Math.sqrt(Math.max(piece.width, piece.height));
}

export function getTumbleProgress(
  elapsed: number,
  duration: number,
  landing: boolean,
) {
  const t = clamp(elapsed / duration);
  if (!landing) return swing(t);
  if (elapsed <= duration) return (1 + OVERSHOOT) * swing(t);
  const back = clamp((elapsed - duration) / (duration * SETTLE));
  return 1 + OVERSHOOT * (1 - settle(back));
}

export function getUnfoldScale(progress: number) {
  return 1 - (1 - clamp(progress)) ** 3;
}

function getPathFrame(
  piece: BauhausPiece,
  steps: readonly BauhausStep[],
  elapsed: number,
  unfold: boolean,
): BauhausFrame {
  const duration = getTumbleDuration(piece);
  const last = steps.length - 1;
  const index = Math.min(last, Math.max(0, Math.floor(elapsed / duration)));
  const local = elapsed - index * duration;
  const landing = index === last;
  const step = steps[index];
  if (landing && local >= duration * (1 + SETTLE)) {
    return getBauhausPoseFrame(piece, step.to);
  }
  const grow = unfold && index === 0 ? getUnfoldScale(local / duration) : 1;
  const progress = getTumbleProgress(local, duration, landing);
  return getBauhausStepFrame(piece, step, progress, grow);
}

function getPieceMotion(
  piece: BauhausPiece,
  arrival: number,
  time: number,
): BauhausFrame {
  const { lead, beat, rebuild } = bauhausBuildTimeline;
  const paths = getBauhausPaths(piece);
  const cue = rebuild + piece.cue;
  if (time >= cue && paths.rebuild.length > 0) {
    return getPathFrame(piece, paths.rebuild, time - cue, false);
  }
  if (paths.enter.length === 0) {
    return getBauhausPoseFrame(piece, piece.slot);
  }
  const travel = paths.enter.length * getTumbleDuration(piece);
  const start = lead + arrival * beat - travel;
  if (time < start) {
    return { ...getBauhausPoseFrame(piece, paths.start), scale: 0 };
  }
  return getPathFrame(piece, paths.enter, time - start, true);
}

export function getBauhausBuildDuration({
  speed = bauhausBuildDefaults.speed,
  loop = bauhausBuildDefaults.loop,
}: Pick<BauhausBuildProps, "speed" | "loop"> = {}) {
  const rate = finite(speed, 1);
  const frames = bauhausBuildTimeline.duration * (loop ? 2 : 1);
  return rate <= 0 ? 1 : Math.max(1, Math.ceil(frames / rate));
}

export function getBauhausBuildOrder(seed = bauhausBuildDefaults.seed) {
  const key = seedKey(seed);
  const rank = (piece: BauhausPiece) =>
    random(`bauhaus-build-${key}-order-${piece.id}`);
  const placed: BauhausPiece[] = [];
  const waiting = [...bauhausBuildPieces];
  while (waiting.length > 0) {
    const ready = waiting.filter((piece) =>
      piece.after.every((id) => placed.some((done) => done.id === id)),
    );
    const next = ready.reduce((best, piece) =>
      rank(piece) < rank(best) ? piece : best,
    );
    placed.push(next);
    waiting.splice(waiting.indexOf(next), 1);
  }
  return placed;
}

export function getBauhausBuildVariant(seed = bauhausBuildDefaults.seed) {
  const index = (((seedKey(seed) - 1) % 4) + 4) % 4;
  return { flipX: index % 2 === 1, flipY: index >= 2 };
}

function getPoster(scale: number, width: number, height: number) {
  const w = Math.max(1, finite(width, 1280));
  const h = Math.max(1, finite(height, 720));
  const size = Math.min(w, h) * FILL * clamp(finite(scale, 1), 0.5, 1.25);
  return { w, h, size, originX: (w - size) / 2, originY: (h - size) / 2 };
}

export function getBauhausBuildField({
  scale = bauhausBuildDefaults.scale,
  width = 1280,
  height = 720,
}: Pick<BauhausBuildProps, "scale"> & {
  width?: number;
  height?: number;
} = {}) {
  const poster = getPoster(scale, width, height);
  const unit = poster.size / bauhausBuildGrid;
  return {
    x: 0,
    y: poster.originY + bauhausBuildBand.top * unit,
    width: poster.w,
    height: (bauhausBuildBand.bottom - bauhausBuildBand.top) * unit,
    unit,
  };
}

export function getBauhausBuildState(
  time: number,
  {
    seed = bauhausBuildDefaults.seed,
    scale = bauhausBuildDefaults.scale,
    loop = bauhausBuildDefaults.loop,
    width = 1280,
    height = 720,
  }: Pick<BauhausBuildProps, "seed" | "scale" | "loop"> & {
    width?: number;
    height?: number;
  } = {},
) {
  const { size, originX, originY } = getPoster(scale, width, height);
  const { duration } = bauhausBuildTimeline;
  const elapsed = Math.max(0, finite(time, 0));
  const folded = elapsed % (duration * 2);
  const local = loop ? Math.min(folded, duration * 2 - folded) : elapsed;
  const pieces = getBauhausBuildOrder(seed).map((piece, arrival) => {
    const motion = getPieceMotion(piece, arrival, local);
    const frame: BauhausPieceFrame = {
      id: piece.id,
      shape: piece.shape,
      role: piece.role,
      width: piece.width,
      height: piece.height,
      ...motion,
      visible: motion.scale > 0.001,
    };
    return frame;
  });
  return {
    time: local,
    size,
    unit: size / bauhausBuildGrid,
    originX,
    originY,
    ...getBauhausBuildVariant(seed),
    pieces,
  };
}

export function getBauhausShapePath(
  shape: BauhausShape,
  width: number,
  height: number,
) {
  const r = width / 2;
  switch (shape) {
    case "circle":
      return `M 0 ${r} A ${r} ${r} 0 1 1 ${width} ${r} A ${r} ${r} 0 1 1 0 ${r} Z`;
    case "semicircle":
      return `M 0 ${height} A ${r} ${r} 0 0 1 ${width} ${height} Z`;
    case "quarter":
      return `M 0 ${height} L 0 0 A ${width} ${height} 0 0 1 ${width} ${height} Z`;
    default:
      return `M 0 0 H ${width} V ${height} H 0 Z`;
  }
}

export function BauhausBuild({
  scale = bauhausBuildDefaults.scale,
  seed = bauhausBuildDefaults.seed,
  inkColor = bauhausBuildDefaults.inkColor,
  accentColor = bauhausBuildDefaults.accentColor,
  secondaryColor = bauhausBuildDefaults.secondaryColor,
  tertiaryColor = bauhausBuildDefaults.tertiaryColor,
  speed = bauhausBuildDefaults.speed,
  loop = bauhausBuildDefaults.loop,
  className,
}: BauhausBuildProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const time = frame * (30 / fps) * Math.max(0, finite(speed, 1));
  const state = getBauhausBuildState(time, {
    seed,
    scale,
    loop,
    width,
    height,
  });
  const fills: Record<BauhausRole, string> = {
    ink: inkColor,
    accent: accentColor,
    secondary: secondaryColor,
    tertiary: tertiaryColor,
  };
  const mirror = `translate(${state.flipX ? width : 0} ${state.flipY ? height : 0}) scale(${state.flipX ? -1 : 1} ${state.flipY ? -1 : 1})`;

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
        aria-label="Geometric Bauhaus composition"
        style={{ display: "block" }}
      >
        <g transform={mirror}>
          {state.pieces.map((piece) =>
            piece.visible ? (
              <path
                key={piece.id}
                d={getBauhausShapePath(piece.shape, piece.width, piece.height)}
                fill={fills[piece.role]}
                transform={`translate(${state.originX + piece.x * state.unit} ${state.originY + piece.y * state.unit}) rotate(${piece.rotation}) scale(${piece.scale * state.unit})`}
              />
            ) : null,
          )}
        </g>
      </svg>
    </div>
  );
}
