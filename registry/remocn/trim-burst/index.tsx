"use client";

import { useMemo } from "react";
import { Easing, random, useCurrentFrame, useVideoConfig } from "remotion";

export type TrimBurstCap = "round" | "butt";

export interface TrimBurstProps {
  x?: number;
  y?: number;
  count?: number;
  innerRadius?: number;
  reach?: number;
  strokeLength?: number;
  weight?: number;
  rotation?: number;
  spread?: number;
  jitter?: number;
  dots?: boolean;
  cap?: TrimBurstCap;
  color?: string;
  seed?: number;
  delay?: number;
  speed?: number;
  className?: string;
}

type Paint = "color" | "className";

export interface TrimBurstOptions extends Omit<TrimBurstProps, Paint> {
  width?: number;
  height?: number;
  fps?: number;
}

export interface TrimBurstStroke {
  index: number;
  angle: number;
  scale: number;
  launch: number;
}

export interface TrimBurstTrim {
  start: number;
  end: number;
  length: number;
}

export interface TrimBurstLine {
  index: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
}

export interface TrimBurstDot {
  index: number;
  cx: number;
  cy: number;
  r: number;
}

export const trimBurstDefaults: Required<Omit<TrimBurstProps, "className">> = {
  x: 0.5,
  y: 0.5,
  count: 8,
  innerRadius: 16,
  reach: 64,
  strokeLength: 56,
  weight: 2,
  rotation: 0,
  spread: 360,
  jitter: 0.5,
  dots: false,
  cap: "round",
  color: "#ffffff",
  seed: 1,
  delay: 0,
  speed: 1,
};

const LIFE = 15;
const LAG = 3;
const STAGGER = 6;
const HOLD = 24;
const LEASH = 6;
const WOBBLE = 0.25;
const MAX_STEP = 45;
const SHRINK = 0.45;
const DOT_START = 4;
const DOT_POP = 4;
const DOT_BACK = 1.4;
const DOT_RADIUS = 1.25;
const DOT_GAP = 2;
const MAX_COUNT = 32;
const MAX_SIZE = 2000;
const MIN_STROKE = 1;
const MIN_WEIGHT = 0.25;
const MAX_WEIGHT = 24;
const VISIBLE = 0.001;
const END_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const START_EASE = Easing.bezier(0.45, 0, 0.55, 1);

const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const within = (
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
) => clamp(finite(value, fallback), min, max);
const round = (value: number) => Math.round(value * 1000) / 1000;
const rateOf = (speed: number | undefined) =>
  Math.max(0, finite(speed, trimBurstDefaults.speed));
const delayOf = (delay: number | undefined) =>
  Math.max(0, finite(delay, trimBurstDefaults.delay));
const countOf = (count: number | undefined) =>
  Math.round(within(count, trimBurstDefaults.count, 1, MAX_COUNT));
const jitterOf = (jitter: number | undefined) =>
  within(jitter, trimBurstDefaults.jitter, 0, 1);
const capOf = (cap: string | undefined): TrimBurstCap =>
  cap === "butt" ? cap : "round";

export function getTrimBurstTimeline(
  options: Pick<TrimBurstOptions, "count" | "jitter"> = {},
) {
  const count = countOf(options.count);
  const stagger = count > 1 ? STAGGER * jitterOf(options.jitter) : 0;
  return { life: LIFE, lag: LAG, stagger, length: LIFE + stagger };
}

export type TrimBurstTimeline = ReturnType<typeof getTrimBurstTimeline>;

export const trimBurstLength = getTrimBurstTimeline().length;

export function getTrimBurstDuration(
  options: Pick<TrimBurstOptions, "count" | "jitter" | "delay" | "speed"> = {},
) {
  const rate = rateOf(options.speed);
  const { length } = getTrimBurstTimeline(options);
  const motion = rate === 0 ? 0 : length / rate;
  return Math.ceil(round(delayOf(options.delay) + motion)) + HOLD;
}

export function getTrimBurstTime(
  frame: number,
  options: Pick<TrimBurstOptions, "fps" | "delay" | "speed"> = {},
) {
  const fps = Math.max(1, finite(options.fps, 30));
  const elapsed = Math.max(0, finite(frame, 0) - delayOf(options.delay));
  return elapsed * (30 / fps) * rateOf(options.speed);
}

export function getTrimBurstEndProgress(time: number) {
  if (Number.isNaN(time) || time <= 0) return 0;
  if (time >= LIFE) return 1;
  return END_EASE(time / LIFE);
}

export function getTrimBurstStartProgress(time: number) {
  if (Number.isNaN(time) || time <= LAG) return 0;
  if (time >= LIFE) return 1;
  return START_EASE((time - LAG) / (LIFE - LAG));
}

export function getTrimBurstLeash(gap: number, strokeLength: number) {
  if (!(gap > 0 && strokeLength > 0)) return 0;
  return gap / (1 + (gap / strokeLength) ** LEASH) ** (1 / LEASH);
}

export function getTrimBurstTrim(
  time: number,
  reach: number,
  strokeLength: number,
): TrimBurstTrim {
  const distance = Math.max(0, finite(reach, 0));
  const end = distance * getTrimBurstEndProgress(time);
  const own = distance * getTrimBurstStartProgress(time);
  const length = getTrimBurstLeash(end - own, strokeLength);
  return { start: end - length, end, length };
}

export function getTrimBurstDotScale(time: number) {
  if (Number.isNaN(time) || time <= DOT_START || time >= LIFE) return 0;
  const pop = Math.min(1, (time - DOT_START) / DOT_POP) - 1;
  const grow = 1 + (DOT_BACK + 1) * pop ** 3 + DOT_BACK * pop ** 2;
  const settle = DOT_START + DOT_POP;
  const shrink = clamp((time - settle) / (LIFE - settle), 0, 1);
  return grow * (1 - shrink ** 3);
}

export function getTrimBurstStrokes(
  options: Pick<
    TrimBurstOptions,
    "count" | "rotation" | "spread" | "jitter" | "seed"
  > = {},
): TrimBurstStroke[] {
  const count = countOf(options.count);
  const rotation = finite(options.rotation, trimBurstDefaults.rotation);
  const spread = within(options.spread, trimBurstDefaults.spread, 0, 360);
  const jitter = jitterOf(options.jitter);
  const seed = finite(options.seed, trimBurstDefaults.seed);
  const fan = spread < 360 && count > 1;
  const step = fan ? spread / (count - 1) : 360 / count;
  const first = fan ? rotation - spread / 2 : rotation;
  const wobble = WOBBLE * jitter * Math.min(step, MAX_STEP);
  const { stagger } = getTrimBurstTimeline({ count, jitter });
  const keys = Array.from({ length: count }, (_, index) =>
    random(`trim-burst-${seed}-order-${index}`),
  );
  const order = keys.map((_, index) => index);
  order.sort((a, b) => keys[a] - keys[b]);
  const ranks: number[] = [];
  for (const [position, index] of order.entries()) ranks[index] = position;
  return keys.map((_, index) => {
    const turn = random(`trim-burst-${seed}-angle-${index}`) * 2 - 1;
    const shrink = random(`trim-burst-${seed}-scale-${index}`);
    return {
      index,
      angle: first + index * step + turn * wobble,
      scale: 1 - SHRINK * jitter * shrink,
      launch: count > 1 ? (stagger * ranks[index]) / (count - 1) : 0,
    };
  });
}

export function getTrimBurstState(
  frame: number,
  options: TrimBurstOptions = {},
  strokes: TrimBurstStroke[] = getTrimBurstStrokes(options),
) {
  const fallback = trimBurstDefaults;
  const width = Math.max(1, finite(options.width, 1280));
  const height = Math.max(1, finite(options.height, 720));
  const unit = height / 720;
  const time = getTrimBurstTime(frame, options);
  const originX = finite(options.x, fallback.x) * width;
  const originY = finite(options.y, fallback.y) * height;
  const inner = within(options.innerRadius, fallback.innerRadius, 0, MAX_SIZE);
  const reach = within(options.reach, fallback.reach, 0, MAX_SIZE);
  const strokeLength = within(
    options.strokeLength,
    fallback.strokeLength,
    MIN_STROKE,
    MAX_SIZE,
  );
  const size = within(options.weight, fallback.weight, MIN_WEIGHT, MAX_WEIGHT);
  const offset = inner * unit;
  const weight = size * unit;
  const gap = DOT_GAP * weight;
  const radius = DOT_RADIUS * weight;
  const lines: TrimBurstLine[] = [];
  const dots: TrimBurstDot[] = [];
  for (const stroke of strokes) {
    const local = time - stroke.launch;
    const trim = getTrimBurstTrim(
      local,
      reach * unit * stroke.scale,
      strokeLength * unit * stroke.scale,
    );
    const angle = (stroke.angle * Math.PI) / 180;
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const along = (distance: number) => ({
      x: round(originX + dx * (offset + distance)),
      y: round(originY + dy * (offset + distance)),
    });
    if (trim.length > VISIBLE) {
      const from = along(trim.start);
      const to = along(trim.end);
      lines.push({
        index: stroke.index,
        x1: from.x,
        y1: from.y,
        x2: to.x,
        y2: to.y,
        width: round(Math.min(weight, trim.length)),
      });
    }
    const pop = options.dots === true ? getTrimBurstDotScale(local) : 0;
    if (pop > 0) {
      const center = along(trim.end + gap + radius);
      dots.push({
        index: stroke.index,
        cx: center.x,
        cy: center.y,
        r: round(radius * pop),
      });
    }
  }
  return {
    width,
    height,
    unit,
    time,
    originX,
    originY,
    weight,
    cap: capOf(options.cap),
    lines,
    dots,
  };
}

export type TrimBurstState = ReturnType<typeof getTrimBurstState>;

export function TrimBurst({
  x = trimBurstDefaults.x,
  y = trimBurstDefaults.y,
  count = trimBurstDefaults.count,
  innerRadius = trimBurstDefaults.innerRadius,
  reach = trimBurstDefaults.reach,
  strokeLength = trimBurstDefaults.strokeLength,
  weight = trimBurstDefaults.weight,
  rotation = trimBurstDefaults.rotation,
  spread = trimBurstDefaults.spread,
  jitter = trimBurstDefaults.jitter,
  dots = trimBurstDefaults.dots,
  cap = trimBurstDefaults.cap,
  color = trimBurstDefaults.color,
  seed = trimBurstDefaults.seed,
  delay = trimBurstDefaults.delay,
  speed = trimBurstDefaults.speed,
  className,
}: TrimBurstProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const strokes = useMemo(
    () => getTrimBurstStrokes({ count, rotation, spread, jitter, seed }),
    [count, rotation, spread, jitter, seed],
  );
  const state = getTrimBurstState(
    frame,
    {
      width,
      height,
      fps,
      x,
      y,
      innerRadius,
      reach,
      strokeLength,
      weight,
      dots,
      cap,
      delay,
      speed,
    },
    strokes,
  );

  return (
    <div
      className={className}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Trim burst"
        style={{ display: "block", overflow: "visible" }}
      >
        <g fill="none" stroke={color} strokeLinecap={state.cap}>
          {state.lines.map((line) => (
            <line
              key={line.index}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              strokeWidth={line.width}
            />
          ))}
        </g>
        <g fill={color}>
          {state.dots.map((dot) => (
            <circle key={dot.index} cx={dot.cx} cy={dot.cy} r={dot.r} />
          ))}
        </g>
      </svg>
    </div>
  );
}
