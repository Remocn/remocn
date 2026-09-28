"use client";

import { useCurrentFrame, useVideoConfig } from "remotion";

export type SquiggleShape = "wave" | "zigzag" | "loops" | "coil";
export type SquiggleJoin = "miter" | "round";

export interface SquiggleProps {
  shape?: SquiggleShape;
  x?: number;
  y?: number;
  length?: number;
  angle?: number;
  amplitude?: number;
  wavelength?: number;
  weight?: number;
  color?: string;
  settle?: number;
  hold?: number;
  erase?: boolean;
  delay?: number;
  speed?: number;
  className?: string;
}

type Paint = "color" | "className";

export interface SquiggleOptions extends Omit<SquiggleProps, Paint> {
  width?: number;
  height?: number;
  fps?: number;
}

export interface SquigglePoint {
  x: number;
  y: number;
}

export interface SquiggleCurveInput {
  shape: SquiggleShape;
  length: number;
  wavelength: number;
  amplitude: number;
  phase: number;
  unit?: number;
}

export const squiggleDefaults: Required<Omit<SquiggleProps, "className">> = {
  shape: "wave",
  x: 0.375,
  y: 0.5,
  length: 320,
  angle: 0,
  amplitude: 14,
  wavelength: 48,
  weight: 3,
  color: "#ffffff",
  settle: 0.5,
  hold: 12,
  erase: true,
  delay: 0,
  speed: 1,
};

type SmoothShape = Exclude<SquiggleShape, "zigzag">;

const DRAW = 24;
const SETTLE = 36;
const ERASE = 18;
const SWIM = 1.5;
const EXIT_SWIM = 0.5;
const TAIL = 14;
const REST = 24;
const MIN_WAVELENGTH = 8;
const LOOP_FLOOR = 3;
const MIN_POINTS = 24;
const MAX_POINTS = 4000;
const EPSILON = 0.01;
const SAMPLES: Record<SmoothShape, number> = { wave: 32, loops: 64, coil: 80 };
const REACH: Record<SmoothShape, number> = { wave: 0, loops: 2.4, coil: 4.2 };

const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 100) / 100;
const rateOf = (speed: number | undefined) =>
  Math.max(0, finite(speed, squiggleDefaults.speed));
const shapeOf = (value: string | undefined): SquiggleShape =>
  value === "zigzag" || value === "loops" || value === "coil" ? value : "wave";
const joinOf = (shape: SquiggleShape): SquiggleJoin =>
  shape === "zigzag" ? "miter" : "round";
const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
const easeInOutSine = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

function smoothstep(value: number) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

export function getSquiggleTimeline(
  options: Pick<SquiggleOptions, "hold" | "erase"> = {},
) {
  const hold = Math.max(0, finite(options.hold, squiggleDefaults.hold));
  const erase = options.erase !== false;
  const eraseStart = SETTLE + hold;
  const eraseEnd = eraseStart + ERASE;
  const end = erase ? eraseEnd : SETTLE;
  return {
    draw: DRAW,
    settle: SETTLE,
    hold,
    erase,
    eraseStart,
    eraseEnd,
    end,
    duration: end + (erase ? TAIL : REST),
  };
}

export type SquiggleTimeline = ReturnType<typeof getSquiggleTimeline>;

export const squiggleLength = getSquiggleTimeline().end;

export function getSquiggleDuration(
  options: Pick<SquiggleOptions, "hold" | "erase" | "speed" | "delay"> = {},
) {
  const rate = rateOf(options.speed);
  if (rate === 0) return 1;
  const delay = Math.max(0, finite(options.delay, squiggleDefaults.delay));
  const { duration } = getSquiggleTimeline(options);
  return Math.max(1, Math.ceil(delay + duration / rate));
}

export function getSquiggleTime(
  frame: number,
  options: Pick<SquiggleOptions, "fps" | "speed" | "delay"> = {},
) {
  const fps = Math.max(1, finite(options.fps, 30));
  const delay = Math.max(0, finite(options.delay, squiggleDefaults.delay));
  const elapsed = Math.max(0, finite(frame, 0) - delay);
  return (elapsed * 30 * rateOf(options.speed)) / fps;
}

export function getSquiggleHead(time: number) {
  if (!(time > 0)) return 0;
  return easeOutQuart(Math.min(1, time / DRAW));
}

export function getSquiggleTail(
  time: number,
  timeline: SquiggleTimeline = getSquiggleTimeline(),
) {
  if (!timeline.erase) return 0;
  const progress = (time - timeline.eraseStart) / ERASE;
  if (!(progress > 0)) return 0;
  return easeInOutCubic(Math.min(1, progress));
}

export function getSquiggleCalm(time: number) {
  if (!(time > 0)) return 0;
  return easeInOutSine(Math.min(1, time / SETTLE));
}

export function getSquigglePhase(
  time: number,
  timeline: SquiggleTimeline = getSquiggleTimeline(),
) {
  const swim = time > 0 ? easeOutCubic(Math.min(1, time / SETTLE)) : 0;
  return SWIM * swim + EXIT_SWIM * getSquiggleTail(time, timeline);
}

export function getSquiggleEnvelope(
  s: number,
  length: number,
  wavelength: number,
) {
  const taper = Math.min(wavelength, length / 3);
  if (!(taper > 0)) return 0;
  return smoothstep(s / taper) * smoothstep((length - s) / taper);
}

function getZigzagCurve(
  length: number,
  wavelength: number,
  amplitude: number,
  shift: number,
) {
  const k = (2 * Math.PI) / wavelength;
  const points: SquigglePoint[] = [{ x: 0, y: 0 }];
  const first = Math.floor(-(Math.PI / 2 + shift) / Math.PI) + 1;
  for (let m = first; points.length < MAX_POINTS - 1; m++) {
    const s = (Math.PI / 2 + m * Math.PI + shift) / k;
    if (s >= length) break;
    if (s <= 0) continue;
    const side = m % 2 === 0 ? 1 : -1;
    const w = getSquiggleEnvelope(s, length, wavelength);
    points.push({ x: s, y: side * amplitude * w });
  }
  points.push({ x: length, y: 0 });
  return points;
}

export function getSquiggleCurve(input: SquiggleCurveInput) {
  const shape = shapeOf(input.shape);
  const length = Math.max(0, finite(input.length, 0));
  const wavelength = Math.max(1e-3, finite(input.wavelength, 1));
  const amplitude = Math.max(0, finite(input.amplitude, 0));
  const unit = Math.max(1e-3, finite(input.unit, 1));
  const shift = 2 * Math.PI * finite(input.phase, 0);
  if (shape === "zigzag") {
    return getZigzagCurve(length, wavelength, amplitude, shift);
  }
  const k = (2 * Math.PI) / wavelength;
  const gate = smoothstep(amplitude / (LOOP_FLOOR * unit));
  const reach = (REACH[shape] / k) * gate;
  const fine = wavelength / (SAMPLES[shape] * Math.max(1, unit));
  const coarsest = Math.max(length / MIN_POINTS, 1e-6);
  const step = clamp(fine, length / (MAX_POINTS - 2), coarsest);
  const sample = (s: number): SquigglePoint => {
    const w = getSquiggleEnvelope(s, length, wavelength);
    const theta = k * s - shift;
    if (shape === "wave") return { x: s, y: amplitude * w * Math.sin(theta) };
    const along = s - reach * w * Math.sin(theta);
    return { x: along, y: -amplitude * w * Math.cos(theta) };
  };
  const offset = (((shift / k) % step) + step) % step;
  const points = [sample(0)];
  for (let j = 0; points.length < MAX_POINTS - 1; j++) {
    const s = offset + j * step;
    if (s >= length) break;
    if (s > 0) points.push(sample(s));
  }
  points.push(sample(length));
  return points;
}

export function getSquiggleTrim(
  points: readonly SquigglePoint[],
  tail: number,
  head: number,
) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    lengths.push(lengths[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const last = points.length - 1;
  const total = last > 0 ? lengths[last] : 0;
  const from = clamp(finite(tail, 0), 0, 1) * total;
  const to = clamp(finite(head, 0), 0, 1) * total;
  const trimmed: SquigglePoint[] = [];
  if (last < 1 || !(to - from > EPSILON)) return { total, points: trimmed };
  const pointAt = (distance: number, index: number): SquigglePoint => {
    const a = points[index - 1];
    const b = points[index];
    const span = lengths[index] - lengths[index - 1];
    const t = span > 0 ? (distance - lengths[index - 1]) / span : 0;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  };
  let index = 1;
  while (index < last && lengths[index] < from) index++;
  trimmed.push(pointAt(from, index));
  while (index < last && lengths[index] < to) {
    trimmed.push(points[index]);
    index++;
  }
  trimmed.push(pointAt(to, index));
  return { total, points: trimmed };
}

export function getSquigglePath(points: readonly SquigglePoint[]) {
  let path = "";
  let previous = "";
  for (const point of points) {
    const pair = `${round(point.x)} ${round(point.y)}`;
    if (pair === previous) continue;
    path += `${path === "" ? "M" : "L"}${pair}`;
    previous = pair;
  }
  return path;
}

export function getSquiggleState(frame: number, options: SquiggleOptions = {}) {
  const width = Math.max(1, finite(options.width, 1280));
  const height = Math.max(1, finite(options.height, 720));
  const unit = height / 720;
  const shape = shapeOf(options.shape);
  const timeline = getSquiggleTimeline(options);
  const time = getSquiggleTime(frame, options);
  const head = getSquiggleHead(time);
  const tail = getSquiggleTail(time, timeline);
  const phase = getSquigglePhase(time, timeline);
  const settle = clamp(finite(options.settle, squiggleDefaults.settle), 0, 1);
  const lively = finite(options.amplitude, squiggleDefaults.amplitude);
  const calm = 1 - settle * getSquiggleCalm(time);
  const amplitude = Math.max(0, lively) * unit * calm;
  const length = Math.max(0, finite(options.length, squiggleDefaults.length));
  const course = length * unit;
  const cycle = finite(options.wavelength, squiggleDefaults.wavelength);
  const wavelength = Math.max(MIN_WAVELENGTH, cycle) * unit;
  const weight = Math.max(0, finite(options.weight, squiggleDefaults.weight));
  const angle = finite(options.angle, squiggleDefaults.angle);
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const start = {
    x: finite(options.x, squiggleDefaults.x) * width,
    y: finite(options.y, squiggleDefaults.y) * height,
  };
  const end = { x: start.x + course * cos, y: start.y + course * sin };
  const drawn = head - tail > 0;
  const curve: SquigglePoint[] = drawn
    ? getSquiggleCurve({
        shape,
        length: course,
        wavelength,
        amplitude,
        phase,
        unit,
      })
    : [];
  const placed = curve.map((point) => ({
    x: start.x + point.x * cos - point.y * sin,
    y: start.y + point.x * sin + point.y * cos,
  }));
  const trim = getSquiggleTrim(placed, tail, head);
  const path = getSquigglePath(trim.points);
  return {
    width,
    height,
    unit,
    shape,
    time,
    timeline,
    head,
    tail,
    phase,
    amplitude,
    wavelength,
    length: course,
    strokeWidth: round(weight * unit),
    join: joinOf(shape),
    start,
    end,
    total: trim.total,
    points: trim.points,
    path,
    visible: path.includes("L"),
  };
}

export type SquiggleState = ReturnType<typeof getSquiggleState>;

export function Squiggle({
  shape = squiggleDefaults.shape,
  x = squiggleDefaults.x,
  y = squiggleDefaults.y,
  length = squiggleDefaults.length,
  angle = squiggleDefaults.angle,
  amplitude = squiggleDefaults.amplitude,
  wavelength = squiggleDefaults.wavelength,
  weight = squiggleDefaults.weight,
  color = squiggleDefaults.color,
  settle = squiggleDefaults.settle,
  hold = squiggleDefaults.hold,
  erase = squiggleDefaults.erase,
  delay = squiggleDefaults.delay,
  speed = squiggleDefaults.speed,
  className,
}: SquiggleProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const state = getSquiggleState(frame, {
    shape,
    x,
    y,
    length,
    angle,
    amplitude,
    wavelength,
    weight,
    settle,
    hold,
    erase,
    delay,
    speed,
    width,
    height,
    fps,
  });

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
        aria-label="Squiggle line"
        style={{ display: "block" }}
      >
        {state.visible ? (
          <path
            d={state.path}
            fill="none"
            stroke={color}
            strokeWidth={state.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin={state.join}
          />
        ) : null}
      </svg>
    </div>
  );
}
