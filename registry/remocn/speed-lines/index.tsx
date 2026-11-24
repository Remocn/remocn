"use client";

import type { ReactNode } from "react";
import { random } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import {
  type ResolvedTimeline,
  resolve,
  type Timing,
  useTimeline,
} from "@/lib/remocn/timeline";
import {
  bounceOf,
  IMPACT,
  modeOf,
  RELEASE,
  RETRACT,
  type SpeedLinesElementId,
  speedLinesTimeline,
  springOf,
  travelOf,
} from "./timeline";

export type SpeedLinesMode = "trail" | "focus";

export interface SpeedLinesPoint {
  x: number;
  y: number;
}

export interface SpeedLinesProps {
  mode?: SpeedLinesMode;
  from?: SpeedLinesPoint;
  to?: SpeedLinesPoint;
  x?: number;
  y?: number;
  count?: number;
  weight?: number;
  spread?: number;
  duration?: number;
  bounce?: number;
  squash?: number;
  color?: string;
  seed?: number;
  delay?: number;
  speed?: number;
  children?: ReactNode;
  className?: string;
  /**
   * Moves, trims or stretches the travel and settle (trail mode) or the
   * rush and release (focus mode), by the ids in `./timeline`.
   * Frames on the scene timeline, after `delay` and `speed`.
   */
  timing?: Timing<SpeedLinesElementId>;
}

type Paint = "color" | "children" | "className";
type Unset = "to" | "children" | "className" | "timing";

export interface SpeedLinesOptions extends Omit<SpeedLinesProps, Paint> {
  width?: number;
  height?: number;
  fps?: number;
  /** The resolved schedule; without it the options' `timing` is applied. */
  timeline?: ResolvedTimeline<SpeedLinesElementId>;
}

export interface SpeedLinesSegment {
  index: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
}

export interface SpeedLinesStreak extends SpeedLinesSegment {
  offset: number;
  reach: number;
}

export interface SpeedLinesRay extends SpeedLinesSegment {
  angle: number;
  rest: number;
  inner: number;
  outer: number;
}

export interface SpeedLinesRayTiming {
  rest: number;
  outer: number;
  start?: number;
  release?: number;
  impact?: number;
  retract?: number;
}

export const speedLinesDefaults: Required<Omit<SpeedLinesProps, Unset>> = {
  mode: "trail",
  from: { x: -0.25, y: 0.5 },
  x: 0.5,
  y: 0.5,
  count: 12,
  weight: 2,
  spread: 96,
  duration: 14,
  bounce: 0.5,
  squash: 0.5,
  color: "#ffffff",
  seed: 1,
  delay: 0,
  speed: 1,
};

const REFERENCE = 720;
const STRETCH = Math.log(1.3);
const SQUASH = Math.log(1.25);
const STRETCH_GAIN = 0.007;
const SQUASH_GAIN = 0.018;
const PROBE = 1e-3;
const CENTER = "translate(-50%, -50%)";
const HOLD = 24;
const SPAWN_START = 0.04;
const SPAWN_END = 0.8;
const LIFE = 0.3;
const MIN_LIFE = 3;
const DRAW = 0.4;
const ERASE = 0.35;
const SHUTTER = 1.6;
const DRIFT = 0.15;
const SETBACK = 0.35;
const SLOW = 5;
const FAST = 14;
const GOLDEN = (Math.sqrt(5) - 1) / 2;
const RELAX = 0.12;
const RELAX_RATE = 1.5;
const ANGLE_JITTER = 0.6;
const RADIUS_JITTER = 0.6;
const MAX_COUNT = 64;
const MIN_WEIGHT = 0.5;
const MAX_WEIGHT = 12;
const MIN_SPREAD = 8;
const MAX_SPREAD = 480;

const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value * 100) / 100;
const fine = (value: number) => Math.round(value * 10000) / 10000;
const fraction = (value: number) => value - Math.floor(value);

function smoothstep(value: number) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function easeOut(value: number) {
  const t = clamp(value, 0, 1);
  return 1 - (1 - t) * (1 - t);
}

function pointOf(
  value: SpeedLinesPoint | undefined,
  fallback: SpeedLinesPoint,
) {
  return { x: finite(value?.x, fallback.x), y: finite(value?.y, fallback.y) };
}

function key(seed: number, index: number, name: string) {
  return random(`speed-lines-${seed}-${index}-${name}`);
}

// The element spans the drawing reads, from the resolved schedule.
function spansOf(options: SpeedLinesOptions, mode: SpeedLinesMode) {
  const tl =
    options.timeline ??
    resolve(speedLinesTimeline(options, { length: 0 }), options.timing);
  if (mode === "focus") {
    const rush = tl.get("rush");
    const release = tl.get("release");
    return {
      travelStart: 0,
      duration: travelOf(options.duration),
      gap: 0,
      settle: undefined,
      impact: rush.end,
      end: release.end,
      rushStart: rush.start,
      rushJitter: rush.beat("jitter"),
      release: release.start,
      releaseJitter: release.beat("jitter"),
      retract: release.beat("retract"),
    };
  }
  const travel = tl.get("travel");
  const settle = tl.get("settle");
  return {
    travelStart: travel.start,
    duration: travel.length,
    gap: settle.start - travel.end,
    settle: settle.length,
    impact: travel.end,
    end: settle.end,
    rushStart: 0,
    rushJitter: 0,
    release: RELEASE,
    releaseJitter: 0,
    retract: RETRACT,
  };
}

function settingsOf(options: SpeedLinesOptions) {
  const mode = modeOf(options.mode);
  const height = Math.max(1, finite(options.height, 720));
  const x = finite(options.x, speedLinesDefaults.x);
  const y = finite(options.y, speedLinesDefaults.y);
  const count = finite(options.count, speedLinesDefaults.count);
  const weight = finite(options.weight, speedLinesDefaults.weight);
  const spread = finite(options.spread, speedLinesDefaults.spread);
  return {
    ...spansOf(options, mode),
    mode,
    width: Math.max(1, finite(options.width, 1280)),
    height,
    fps: Math.max(1, finite(options.fps, 30)),
    unit: height / REFERENCE,
    from: pointOf(options.from, speedLinesDefaults.from),
    to: pointOf(options.to, { x, y }),
    x,
    y,
    count: Math.round(clamp(count, 1, MAX_COUNT)),
    weight: clamp(weight, MIN_WEIGHT, MAX_WEIGHT),
    spread: clamp(spread, MIN_SPREAD, MAX_SPREAD),
    bounce: bounceOf(options.bounce),
    squash: clamp(finite(options.squash, speedLinesDefaults.squash), 0, 1),
    seed: finite(options.seed, speedLinesDefaults.seed),
    delay: Math.max(0, finite(options.delay, speedLinesDefaults.delay)),
    speed: Math.max(0, finite(options.speed, speedLinesDefaults.speed)),
  };
}

type Settings = ReturnType<typeof settingsOf>;

function directionOf(settings: Settings) {
  const { from, to, width, height } = settings;
  const dx = (to.x - from.x) * width;
  const dy = (to.y - from.y) * height;
  const distance = Math.hypot(dx, dy);
  if (distance < 1e-6) return { dx: 1, dy: 0, distance: 0 };
  return { dx: dx / distance, dy: dy / distance, distance };
}

function along(position: number, size: number, step: number) {
  if (step > 1e-9) return (size - position) / step;
  if (step < -1e-9) return -position / step;
  return Number.POSITIVE_INFINITY;
}

function exitDistance(
  cx: number,
  cy: number,
  cos: number,
  sin: number,
  width: number,
  height: number,
) {
  const inside = cx >= 0 && cx <= width && cy >= 0 && cy <= height;
  if (!inside) {
    const reachX = Math.max(Math.abs(cx), Math.abs(width - cx));
    const reachY = Math.max(Math.abs(cy), Math.abs(height - cy));
    return Math.hypot(reachX, reachY);
  }
  return Math.min(along(cx, width, cos), along(cy, height, sin));
}

// `gap` holds the landing before the settle starts; `span` is the settle's
// length when `timing` trimmed or stretched it.
function easeOf(
  time: number,
  travel: number,
  bounce: number,
  gap = 0,
  span?: number,
) {
  if (time <= 0) return 0;
  const { kappa, gain, contact, decay, ring, settle } = springOf(bounce);
  if (time < travel) {
    const w = time / travel;
    return gain * ((w * w) / 2 - (kappa * w * w * w) / 3);
  }
  const late = time - travel - gap;
  if (late < 0) return 1;
  const since = span === undefined ? late : late * (settle / span);
  if (since >= settle) return 1;
  const taper = smoothstep((2 * since) / settle - 1);
  const wave = ring > 1e-9 ? Math.sin(ring * since) / ring : since;
  const envelope = Math.exp(-decay * since) * (1 - taper);
  return 1 + (contact / travel) * wave * envelope;
}

export function getSpeedLinesTimeline(options: SpeedLinesOptions = {}) {
  const { mode, impact, end } = settingsOf(options);
  return { mode, impact, end };
}

export type SpeedLinesTimeline = ReturnType<typeof getSpeedLinesTimeline>;

export const speedLinesLength = getSpeedLinesTimeline().end;

export function getSpeedLinesDuration(options: SpeedLinesOptions = {}) {
  const { delay, speed } = settingsOf(options);
  if (speed === 0) return 1;
  const { end } = getSpeedLinesTimeline(options);
  return Math.max(1, Math.ceil(delay + (end + HOLD) / speed));
}

export function getSpeedLinesTime(
  frame: number,
  options: SpeedLinesOptions = {},
) {
  const { fps, delay, speed } = settingsOf(options);
  const elapsed = Math.max(0, finite(frame, 0) - delay);
  return elapsed * (30 / fps) * speed;
}

export function getSpeedLinesEase(
  time: number,
  options: SpeedLinesOptions = {},
) {
  const { travelStart, duration, bounce, gap, settle } = settingsOf(options);
  return easeOf(finite(time, 0) - travelStart, duration, bounce, gap, settle);
}

function positionAt(time: number, settings: Settings) {
  const { mode, from, to, width, height, duration, bounce } = settings;
  if (mode === "focus") {
    return { x: settings.x * width, y: settings.y * height, progress: 1 };
  }
  const { travelStart, gap, settle } = settings;
  const progress = easeOf(time - travelStart, duration, bounce, gap, settle);
  const startX = from.x * width;
  const startY = from.y * height;
  return {
    x: startX + (to.x * width - startX) * progress,
    y: startY + (to.y * height - startY) * progress,
    progress,
  };
}

export function getSpeedLinesPosition(
  time: number,
  options: SpeedLinesOptions = {},
) {
  const { x, y } = positionAt(finite(time, 0), settingsOf(options));
  return { x, y };
}

function shapeAt(at: number, settings: Settings) {
  const { mode, duration, bounce, squash, unit, speed } = settings;
  if (mode === "focus") return { rotation: 0, along: 1, across: 1 };
  const { gap, settle } = settings;
  const time = at - settings.travelStart;
  const { dx, dy, distance } = directionOf(settings);
  const rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (squash === 0 || distance === 0 || time <= 0) {
    return { rotation, along: 1, across: 1 };
  }
  const span = distance / unit;
  const ahead = easeOf(time + PROBE, duration, bounce, gap, settle);
  const behind = easeOf(time - PROBE, duration, bounce, gap, settle);
  const rate = (Math.abs(ahead - behind) / (2 * PROBE)) * span * speed;
  const landed =
    time > duration ? easeOf(time, duration, bounce, gap, settle) - 1 : 0;
  const past = Math.max(0, landed) * span;
  const stretch = STRETCH * Math.tanh((squash * STRETCH_GAIN * rate) / STRETCH);
  const compression =
    SQUASH * Math.tanh((squash * SQUASH_GAIN * past) / SQUASH);
  const strain = clamp(stretch - compression, -SQUASH, STRETCH);
  return { rotation, along: Math.exp(strain), across: Math.exp(-strain) };
}

export function getSpeedLinesShape(
  time: number,
  options: SpeedLinesOptions = {},
) {
  return shapeAt(finite(time, 0), settingsOf(options));
}

export type SpeedLinesShape = ReturnType<typeof getSpeedLinesShape>;

export function getSpeedLinesVelocity(
  frame: number,
  options: SpeedLinesOptions = {},
) {
  const settings = settingsOf(options);
  const current = finite(frame, 0);
  const now = positionAt(getSpeedLinesTime(current, options), settings);
  const before = positionAt(getSpeedLinesTime(current - 1, options), settings);
  const scale = settings.fps / 30;
  const x = (now.x - before.x) * scale;
  const y = (now.y - before.y) * scale;
  const { dx, dy } = directionOf(settings);
  return { x, y, forward: x * dx + y * dy };
}

function streakSeeds(settings: Settings) {
  const { seed, count, spread, unit } = settings;
  const band = spread * unit;
  const phase = random(`speed-lines-${seed}-lanes`);
  return Array.from({ length: count }, (_, index) => {
    const jitter = (key(seed, index, "lane") - 0.5) / (2 * count);
    const lane = fraction(phase + GOLDEN * index + jitter);
    const slot = (index + key(seed, index, "spawn")) / count;
    return {
      index,
      spawn: SPAWN_START + (SPAWN_END - SPAWN_START) * slot,
      offset: band * (lane - 0.5),
      factor: 0.5 + 0.5 * key(seed, index, "length"),
      setback: SETBACK * band * key(seed, index, "setback"),
    };
  });
}

export function getSpeedLinesStreaks(
  frame: number,
  options: SpeedLinesOptions = {},
): SpeedLinesStreak[] {
  const settings = settingsOf(options);
  if (settings.mode !== "trail") return [];
  const at = getSpeedLinesTime(frame, options);
  const time = at - settings.travelStart;
  const { dx, dy, distance } = directionOf(settings);
  if (distance === 0 || time <= 0) return [];
  const { forward } = getSpeedLinesVelocity(frame, options);
  const { unit, duration, bounce, weight } = settings;
  const fast = smoothstep((forward - SLOW * unit) / ((FAST - SLOW) * unit));
  const gate = fast * (1 - smoothstep(time - duration));
  if (gate <= 0) return [];
  const center = positionAt(at, settings);
  const progress = time / duration;
  const life = Math.max(MIN_LIFE, LIFE * duration) / duration;
  const minimum = 0.5 * weight * unit;
  const streaks: SpeedLinesStreak[] = [];
  for (const streak of streakSeeds(settings)) {
    const age = (progress - streak.spawn) / life;
    if (age <= 0 || age >= 1) continue;
    const reach = SHUTTER * streak.factor * forward * gate;
    const drawn = easeOut(age / DRAW);
    const erased = smoothstep((age - ERASE) / (1 - ERASE));
    const length = reach * (drawn - erased);
    if (length < minimum) continue;
    const spawned = easeOf(streak.spawn * duration, duration, bounce);
    const since = Math.max(0, (center.progress - spawned) * distance);
    const base = streak.setback + DRIFT * since;
    const front = base + reach * erased;
    const back = base + reach * drawn;
    const laneX = center.x - dy * streak.offset;
    const laneY = center.y + dx * streak.offset;
    streaks.push({
      index: streak.index,
      offset: streak.offset,
      reach,
      x1: round(laneX - dx * front),
      y1: round(laneY - dy * front),
      x2: round(laneX - dx * back),
      y2: round(laneY - dy * back),
      length,
    });
  }
  return streaks;
}

export function getSpeedLinesRadius(time: number, ray: SpeedLinesRayTiming) {
  const {
    rest,
    outer,
    start = 0,
    release = RELEASE,
    impact = IMPACT,
    retract = RETRACT,
  } = ray;
  const t = finite(time, 0);
  if (t <= start) return outer;
  if (t < impact) {
    const q = (t - start) / (impact - start);
    return outer + (rest - outer) * q * q;
  }
  const settle = (at: number) =>
    rest * (1 + RELAX * (1 - Math.exp(-(at - impact) / RELAX_RATE)));
  if (t < release) return settle(t);
  const held = settle(release);
  const q = clamp((t - release) / retract, 0, 1);
  return outer - (outer - held) * (1 - q * q);
}

export function getSpeedLinesRays(
  frame: number,
  options: SpeedLinesOptions = {},
): SpeedLinesRay[] {
  const settings = settingsOf(options);
  if (settings.mode !== "focus") return [];
  const time = getSpeedLinesTime(frame, options);
  if (time <= settings.rushStart || time >= settings.end) return [];
  const { seed, count, spread, weight, unit, width, height } = settings;
  const cx = settings.x * width;
  const cy = settings.y * height;
  const minimum = 0.5 * weight * unit;
  const rotation = random(`speed-lines-${seed}-rotation`);
  const rays: SpeedLinesRay[] = [];
  for (let index = 0; index < count; index++) {
    const jitter = ANGLE_JITTER * (key(seed, index, "angle") - 0.5);
    const angle = 2 * Math.PI * (rotation + (index + jitter) / count);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const reach = RADIUS_JITTER * key(seed, index, "radius");
    const rest = spread * unit * (1 + reach);
    const outer = exitDistance(cx, cy, cos, sin, width, height) + weight * unit;
    const inner = getSpeedLinesRadius(time, {
      rest,
      outer,
      start:
        settings.rushStart + settings.rushJitter * key(seed, index, "rush"),
      release:
        settings.release + settings.releaseJitter * key(seed, index, "release"),
      impact: settings.impact,
      retract: settings.retract,
    });
    const length = outer - inner;
    if (length < minimum) continue;
    rays.push({
      index,
      angle,
      rest,
      inner,
      outer,
      x1: round(cx + cos * inner),
      y1: round(cy + sin * inner),
      x2: round(cx + cos * outer),
      y2: round(cy + sin * outer),
      length,
    });
  }
  return rays;
}

export function getSpeedLinesState(
  frame: number,
  options: SpeedLinesOptions = {},
) {
  const settings = settingsOf(options);
  const time = getSpeedLinesTime(frame, options);
  const point = positionAt(time, settings);
  const shape = shapeAt(time, settings);
  const rotation = round(shape.rotation);
  const scale = `scale(${fine(shape.along)}, ${fine(shape.across)})`;
  const streaks = getSpeedLinesStreaks(frame, options);
  const rays = getSpeedLinesRays(frame, options);
  const path = [...streaks, ...rays]
    .map(({ x1, y1, x2, y2 }) => `M ${x1} ${y1} L ${x2} ${y2}`)
    .join(" ");
  return {
    mode: settings.mode,
    width: settings.width,
    height: settings.height,
    unit: settings.unit,
    time,
    x: point.x,
    y: point.y,
    left: (point.x / settings.width) * 100,
    top: (point.y / settings.height) * 100,
    radius: (settings.spread * settings.unit) / 2,
    strokeWidth: settings.weight * settings.unit,
    rotation,
    along: shape.along,
    across: shape.across,
    transform:
      shape.along === 1
        ? CENTER
        : `${CENTER} rotate(${rotation}deg) ${scale} rotate(${-rotation}deg)`,
    streaks,
    rays,
    path,
  };
}

export type SpeedLinesState = ReturnType<typeof getSpeedLinesState>;

export function SpeedLines(props: SpeedLinesProps) {
  const {
    mode = speedLinesDefaults.mode,
    from = speedLinesDefaults.from,
    to,
    x = speedLinesDefaults.x,
    y = speedLinesDefaults.y,
    count = speedLinesDefaults.count,
    weight = speedLinesDefaults.weight,
    spread = speedLinesDefaults.spread,
    duration = speedLinesDefaults.duration,
    bounce = speedLinesDefaults.bounce,
    squash = speedLinesDefaults.squash,
    color = speedLinesDefaults.color,
    seed = speedLinesDefaults.seed,
    delay = speedLinesDefaults.delay,
    speed = speedLinesDefaults.speed,
    children,
    className,
    timing,
  } = props;
  const frame = useSceneFrame();
  const { width, height, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    speedLinesTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const state = getSpeedLinesState(frame, {
    mode,
    from,
    to,
    x,
    y,
    count,
    weight,
    spread,
    duration,
    bounce,
    squash,
    seed,
    delay,
    speed,
    width,
    height,
    fps,
    timeline: tl,
  });
  const fallback = state.mode === "trail" && children === undefined;
  const placed = children !== undefined && children !== null;

  return (
    <div
      className={className}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, display: "block" }}
      >
        {state.path ? (
          <path
            d={state.path}
            fill="none"
            stroke={color}
            strokeWidth={state.strokeWidth}
            strokeLinecap="round"
          />
        ) : null}
        {fallback ? (
          <ellipse
            cx={state.x}
            cy={state.y}
            rx={state.radius * state.along}
            ry={state.radius * state.across}
            transform={`rotate(${state.rotation} ${state.x} ${state.y})`}
            fill={color}
          />
        ) : null}
      </svg>
      {placed ? (
        <div
          style={{
            position: "absolute",
            left: `${state.left}%`,
            top: `${state.top}%`,
            width: "max-content",
            transform: state.transform,
            transformOrigin: "50% 50%",
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
