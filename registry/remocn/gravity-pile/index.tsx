"use client";

import type React from "react";
import { useMemo } from "react";
import {
  AbsoluteFill,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type GravityPileColors = {
  background: string;
  shapes: string[];
  accent: string;
  floor: string;
};

export type GravityPileProps = {
  /** Number of falling bodies. */
  count?: number;
  seed?: number;
  /** Gravity multiplier. */
  gravity?: number;
  /** Optional nodes dropped as round bodies, landing on top of the heap. */
  items?: React.ReactNode[];
  colors?: Partial<GravityPileColors>;
  /** Color of the single accent body. Overrides `colors.accent`. */
  accentColor?: string;
  /** Background color. Overrides `colors.background`. */
  backgroundColor?: string;
  speed?: number;
};

export const gravityPileDefaults = {
  count: 30,
  seed: 7,
  gravity: 1,
  colors: {
    background: "#111111",
    shapes: ["#FFFFFF", "#C9C9C9", "#7A7A7A"],
    accent: "#E5322D",
    floor: "#FFFFFF",
  } satisfies GravityPileColors,
  speed: 1,
};

type Kind = "circle" | "square" | "triangle" | "item";
type Body = { r: number; kind: Kind; color: number; accent: boolean };
type Sim = { bodies: Body[]; frames: Float32Array[]; floor: number };

const FRAMES = 150;
const SUBSTEPS = 10;
const ITERATIONS = 4;
const BOUNCE = 0.42;
const FRICTION = 0.12;
const DAMPING = 0.999;
const GRIP = 0.45;
const SETTLE_FROM = 46;
const SETTLE_FRAMES = 18;

// Verlet integration with position-based circle contacts. Runs once per
// (size, count, seed, gravity), records every frame, and the component only
// reads the table back.
function simulate(
  width: number,
  height: number,
  count: number,
  seed: number,
  gravity: number,
  itemCount: number,
): Sim {
  const rnd = (key: string, i: number) =>
    random(`gravity-pile-${seed}-${key}-${i}`);
  const floor = height * 0.9;
  const g = (height / 200) * gravity;
  const dt = 1 / SUBSTEPS;
  // Weaker gravity means a slower rain, so the heap settles later.
  const settleFrom = SETTLE_FROM / Math.sqrt(Math.max(0.2, gravity));
  const kinds: Kind[] = ["circle", "square", "triangle"];
  const accentIndex = Math.max(0, count - itemCount - 3);
  const bodies: Body[] = Array.from({ length: count }, (_, i) => ({
    r: height * (0.036 + rnd("r", i) * 0.032),
    kind: i >= count - itemCount ? "item" : kinds[Math.floor(rnd("k", i) * 3)],
    color: Math.floor(rnd("c", i) * 3),
    accent: i === accentIndex,
  }));
  const n = bodies.length;
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  const px = new Float64Array(n);
  const py = new Float64Array(n);
  const angle = new Float64Array(n);
  const spin = new Float64Array(n);
  // Spawn in a tall column above the frame, rejecting overlaps so nothing
  // explodes apart on the first step.
  for (let i = 0; i < n; i++) {
    const r = bodies[i].r;
    const band = height * (0.1 + (i / Math.max(1, n)) * 2);
    for (let attempt = 0; attempt < 40; attempt++) {
      x[i] = width * (0.5 + (rnd(`x${attempt}`, i) - 0.5) * 0.26);
      y[i] = -r - band - rnd(`y${attempt}`, i) * height * 0.25;
      let clear = true;
      for (let j = 0; j < i && clear; j++) {
        const gap = bodies[i].r + bodies[j].r + 2;
        clear = (x[i] - x[j]) ** 2 + (y[i] - y[j]) ** 2 > gap * gap;
      }
      if (clear) break;
    }
    px[i] = x[i] - (rnd("vx", i) - 0.5) * 0.6 * dt;
    py[i] = y[i] - height * 0.004 * dt;
    angle[i] = rnd("a", i) * Math.PI * 2;
    spin[i] = (rnd("s", i) - 0.5) * 0.02;
  }

  const frames: Float32Array[] = [];
  const record = () => {
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      out[i * 3] = x[i];
      out[i * 3 + 1] = y[i];
      out[i * 3 + 2] = angle[i];
    }
    frames.push(out);
  };
  record();

  for (let f = 1; f <= FRAMES; f++) {
    // Once damped out, the heap sleeps: no more solver creep.
    if (f > settleFrom + SETTLE_FRAMES) {
      frames.push(frames[frames.length - 1]);
      continue;
    }
    for (let s = 0; s < SUBSTEPS; s++) {
      // Late in the sim, bleed energy off so the heap comes fully to rest
      // instead of creeping forever.
      const settle = Math.min(1, Math.max(0, (f - settleFrom) / SETTLE_FRAMES));
      const damping = DAMPING - settle * 0.12;
      for (let i = 0; i < n; i++) {
        const vx = (x[i] - px[i]) * damping;
        const vy = (y[i] - py[i]) * damping;
        px[i] = x[i];
        py[i] = y[i];
        x[i] += vx;
        y[i] += vy + g * dt * dt;
      }
      for (let it = 0; it < ITERATIONS; it++) {
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const dx = x[j] - x[i];
            const dy = y[j] - y[i];
            const min = bodies[i].r + bodies[j].r;
            const d2 = dx * dx + dy * dy;
            if (d2 >= min * min || d2 === 0) continue;
            const d = Math.sqrt(d2);
            const push = (min - d) / d;
            const mi = bodies[i].r ** 2;
            const mj = bodies[j].r ** 2;
            const wi = mj / (mi + mj);
            const wj = mi / (mi + mj);
            x[i] -= dx * push * wi;
            y[i] -= dy * push * wi;
            x[j] += dx * push * wj;
            y[j] += dy * push * wj;
          }
        }
        for (let i = 0; i < n; i++) {
          const r = bodies[i].r;
          if (y[i] + r > floor) {
            const vy = y[i] - py[i];
            y[i] = floor - r;
            // Reflect only real impacts so resting bodies do not buzz.
            py[i] = vy > g * dt * 4 ? y[i] + vy * BOUNCE : y[i];
            px[i] = x[i] - (x[i] - px[i]) * (1 - FRICTION);
          }
          if (x[i] - r < 0) {
            x[i] = r;
            px[i] = x[i] + (x[i] - px[i]) * BOUNCE;
          }
          if (x[i] + r > width) {
            x[i] = width - r;
            px[i] = x[i] + (x[i] - px[i]) * BOUNCE;
          }
        }
      }
      // Contact friction: damp relative sliding so bodies stack instead of
      // flowing apart like marbles.
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const dx = x[j] - x[i];
          const dy = y[j] - y[i];
          const min = bodies[i].r + bodies[j].r + 0.5;
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min || d2 === 0) continue;
          const d = Math.sqrt(d2);
          const tx = -dy / d;
          const ty = dx / d;
          const rel =
            (x[j] - px[j] - (x[i] - px[i])) * tx +
            (y[j] - py[j] - (y[i] - py[i])) * ty;
          const mi = bodies[i].r ** 2;
          const mj = bodies[j].r ** 2;
          const k = rel * GRIP;
          px[i] -= tx * k * (mj / (mi + mj));
          py[i] -= ty * k * (mj / (mi + mj));
          px[j] += tx * k * (mi / (mi + mj));
          py[j] += ty * k * (mi / (mi + mj));
        }
      }
      for (let i = 0; i < n; i++) {
        const r = bodies[i].r;
        const vx = x[i] - px[i];
        // Bodies near the floor or the heap roll; free-falling ones keep spinning.
        const grounded =
          y[i] + r > floor - 1 || Math.abs(y[i] - py[i]) < g * dt;
        if (grounded) spin[i] = Math.abs(vx) > 0.05 ? vx / r : spin[i] * 0.8;
        angle[i] += spin[i];
      }
    }
    record();
  }
  return { bodies, frames, floor };
}

function Shape({ body, fill }: { body: Body; fill: string }) {
  const r = body.r;
  if (body.kind === "circle") return <circle r={r} fill={fill} />;
  if (body.kind === "square") {
    const h = r * 0.84;
    return (
      <rect
        x={-h}
        y={-h}
        width={h * 2}
        height={h * 2}
        rx={r * 0.12}
        fill={fill}
      />
    );
  }
  const c = r * 1.12;
  const pts = [0, 1, 2]
    .map((k) => {
      const a = -Math.PI / 2 + (k * Math.PI * 2) / 3;
      return `${(Math.cos(a) * c).toFixed(2)},${(Math.sin(a) * c + r * 0.12).toFixed(2)}`;
    })
    .join(" ");
  return (
    <polygon
      points={pts}
      fill={fill}
      strokeLinejoin="round"
      stroke={fill}
      strokeWidth={r * 0.14}
    />
  );
}

export function GravityPile({
  count = gravityPileDefaults.count,
  seed = gravityPileDefaults.seed,
  gravity = gravityPileDefaults.gravity,
  items,
  colors: colorOverrides,
  accentColor,
  backgroundColor,
  speed = gravityPileDefaults.speed,
}: GravityPileProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const baseColors = { ...gravityPileDefaults.colors, ...colorOverrides };
  const colors = {
    ...baseColors,
    accent: accentColor ?? baseColors.accent,
    background: backgroundColor ?? baseColors.background,
  };
  const itemCount = Math.min(
    items?.length ?? 0,
    Math.max(1, Math.round(count)),
  );
  const sim = useMemo(
    () =>
      simulate(
        width,
        height,
        Math.max(1, Math.round(count)),
        seed,
        gravity,
        itemCount,
      ),
    [width, height, count, seed, gravity, itemCount],
  );

  const t = Math.min(FRAMES, Math.max(0, (frame * speed * 30) / fps));
  const f0 = Math.floor(t);
  const f1 = Math.min(FRAMES, f0 + 1);
  const mix = t - f0;
  const a = sim.frames[f0];
  const b = sim.frames[f1];
  const n = sim.bodies.length;

  return (
    <AbsoluteFill
      style={{ backgroundColor: colors.background, overflow: "hidden" }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <line
          x1={0}
          x2={width}
          y1={sim.floor + 1}
          y2={sim.floor + 1}
          stroke={colors.floor}
          strokeOpacity={0.25}
          strokeWidth={2}
        />
        {sim.bodies.map((body, i) => {
          if (body.kind === "item") return null;
          const x = a[i * 3] + (b[i * 3] - a[i * 3]) * mix;
          const y = a[i * 3 + 1] + (b[i * 3 + 1] - a[i * 3 + 1]) * mix;
          const rot = a[i * 3 + 2] + (b[i * 3 + 2] - a[i * 3 + 2]) * mix;
          const fill = body.accent
            ? colors.accent
            : colors.shapes[body.color % colors.shapes.length];
          return (
            <g
              key={i}
              transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${((rot * 180) / Math.PI).toFixed(2)})`}
            >
              <Shape body={body} fill={fill} />
            </g>
          );
        })}
      </svg>
      {items?.slice(0, itemCount).map((item, j) => {
        const i = n - itemCount + j;
        const body = sim.bodies[i];
        const x = a[i * 3] + (b[i * 3] - a[i * 3]) * mix;
        const y = a[i * 3 + 1] + (b[i * 3 + 1] - a[i * 3 + 1]) * mix;
        const rot = a[i * 3 + 2] + (b[i * 3 + 2] - a[i * 3 + 2]) * mix;
        return (
          <div
            key={j}
            style={{
              position: "absolute",
              left: x - body.r,
              top: y - body.r,
              width: body.r * 2,
              height: body.r * 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `rotate(${rot}rad)`,
            }}
          >
            {item}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
