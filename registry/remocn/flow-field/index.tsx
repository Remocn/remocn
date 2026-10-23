"use client";

import { useMemo } from "react";
import {
  AbsoluteFill,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type FlowFieldProps = {
  /** Number of particles in flight. */
  particles?: number;
  /** Trail length in simulation steps (frames). */
  trailLength?: number;
  /** Frames for one seamless loop of the field and the particle lifecycles. */
  loopFrames?: number;
  /** Particle lifetime in frames, rounded so it divides loopFrames. */
  lifeFrames?: number;
  /** Share of particles drawn in the accent color, 0 to 1. */
  accentRatio?: number;
  /** Trail width in px at 720p. */
  strokeWidth?: number;
  seed?: number;
  speed?: number;
  background?: string;
  color?: string;
  accent?: string;
};

export const flowFieldDefaults: Required<FlowFieldProps> = {
  particles: 300,
  trailLength: 72,
  loopFrames: 300,
  lifeFrames: 150,
  accentRatio: 0.1,
  strokeWidth: 1.4,
  seed: 1,
  speed: 1,
  background: "#111111",
  color: "#FFFFFF",
  accent: "#E5322D",
};

const TAU = Math.PI * 2;
const WAVES = 4;
// Distance per frame in units of the short side of the frame.
const STEP = 0.0042;
const BUCKETS = 6;

type Wave = {
  fx: number;
  fy: number;
  phase: number;
  drift: number;
  amp: number;
};

function makeField(seed: number) {
  const r = (key: string) => random(`flow-field-${seed}-${key}`);
  const base = r("base") * TAU;
  const waves: Wave[] = Array.from({ length: WAVES }, (_, k) => ({
    fx: (r(`fx${k}`) * 2 - 1) * (0.9 + k * 0.8),
    fy: (r(`fy${k}`) * 2 - 1) * (0.9 + k * 0.8),
    phase: r(`ph${k}`) * TAU,
    drift: 0.6 + r(`dr${k}`) * 0.9,
    amp: 1.6 / (1 + k * 1.4),
  }));
  // Flow angle at (x, y). `tau` walks around a circle once per loop, so the
  // field at the end of the loop is exactly the field at the start.
  return (x: number, y: number, tau: number) => {
    let a = base;
    for (const w of waves) {
      a +=
        w.amp *
        Math.sin(
          w.fx * x + w.fy * y + w.phase + w.drift * Math.sin(tau + w.phase),
        );
    }
    return a;
  };
}

const fmt = (n: number) => Math.round(n * 10) / 10;

export function FlowField({
  particles = flowFieldDefaults.particles,
  trailLength = flowFieldDefaults.trailLength,
  loopFrames = flowFieldDefaults.loopFrames,
  lifeFrames = flowFieldDefaults.lifeFrames,
  accentRatio = flowFieldDefaults.accentRatio,
  strokeWidth = flowFieldDefaults.strokeWidth,
  seed = flowFieldDefaults.seed,
  speed = flowFieldDefaults.speed,
  background = flowFieldDefaults.background,
  color = flowFieldDefaults.color,
  accent = flowFieldDefaults.accent,
}: FlowFieldProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const field = useMemo(() => makeField(seed), [seed]);

  const unit = Math.min(width, height);
  const spanX = width / unit;
  const spanY = height / unit;
  const loop = Math.max(1, Math.round(loopFrames));
  const lives = Math.max(1, Math.round(loop / Math.max(1, lifeFrames)));
  const life = loop / lives;
  const trail = Math.max(2, Math.min(trailLength, life * 0.6));
  const travel = life - trail;
  const time = frame * speed;

  const paths = {
    color: new Array<string>(BUCKETS).fill(""),
    accent: new Array<string>(BUCKETS).fill(""),
  };
  const pts: number[] = [];

  for (let i = 0; i < particles; i++) {
    const offset = random(`flow-field-${seed}-off-${i}`) * life;
    const local = time + offset;
    const cycle = Math.floor(local / life);
    const age = local - cycle * life;
    // Head moves for `travel` frames, then stops while the tail catches up,
    // so trails grow in and drain out instead of popping.
    const head = Math.min(age, travel);
    const tail = Math.max(0, age - trail);
    if (head - tail < 0.05) continue;

    const slot = ((cycle % lives) + lives) % lives;
    const key = `flow-field-${seed}-p${i}-c${slot}`;
    let x = -0.08 + random(`${key}-x`) * (spanX + 0.16);
    let y = -0.08 + random(`${key}-y`) * (spanY + 0.16);
    const birth = time - age;

    pts.length = 0;
    pts.push(x, y);
    const steps = Math.ceil(head);
    for (let s = 0; s < steps; s++) {
      const a = field(x, y, (TAU * (birth + s)) / loop);
      x += Math.cos(a) * STEP;
      y += Math.sin(a) * STEP;
      pts.push(x, y);
    }
    const at = (k: number) => {
      const j = Math.min(Math.floor(k), steps - 1);
      const f = k - j;
      if (j < 0) return [pts[0], pts[1]];
      return [
        pts[j * 2] + (pts[j * 2 + 2] - pts[j * 2]) * f,
        pts[j * 2 + 1] + (pts[j * 2 + 3] - pts[j * 2 + 1]) * f,
      ];
    };

    const target =
      random(`flow-field-${seed}-accent-${i}`) < accentRatio
        ? paths.accent
        : paths.color;
    // Split the visible trail into age buckets; older buckets are fainter.
    for (let b = 0; b < BUCKETS; b++) {
      const from = Math.max(tail, age - (trail * (b + 1)) / BUCKETS);
      const to = Math.min(head, age - (trail * b) / BUCKETS);
      if (to - from <= 0.01) continue;
      const [fx, fy] = at(from);
      let d = `M ${fmt(fx * unit)} ${fmt(fy * unit)}`;
      for (let k = Math.floor(from) + 1; k < to; k++) {
        d += ` L ${fmt(pts[k * 2] * unit)} ${fmt(pts[k * 2 + 1] * unit)}`;
      }
      const [tx, ty] = at(to);
      d += ` L ${fmt(tx * unit)} ${fmt(ty * unit)} `;
      target[b] += d;
    }
  }

  const sw = (strokeWidth * unit) / 720;
  const layers = [
    { key: "color", paint: color, list: paths.color },
    { key: "accent", paint: accent, list: paths.accent },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Flow field"
        style={{ display: "block" }}
      >
        {layers.map((layer) => (
          <g
            key={layer.key}
            fill="none"
            stroke={layer.paint}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {layer.list.map((d, b) => (
              <path
                key={b}
                d={d}
                strokeOpacity={0.9 * (1 - b / BUCKETS) ** 1.4}
                strokeWidth={sw * (1 - (b / BUCKETS) * 0.5)}
              />
            ))}
          </g>
        ))}
      </svg>
    </AbsoluteFill>
  );
}
