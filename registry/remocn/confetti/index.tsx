"use client";

import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export interface ConfettiProps {
  /** Number of confetti pieces. */
  particleCount?: number;
  colors?: string[];
  /** Burst origin as a 0..1 fraction of the canvas. */
  originX?: number;
  originY?: number;
  /** Frame the burst fires on. */
  startFrame?: number;
  /** Lifetime of the burst, in frames. */
  lifetime?: number;
  /** Initial launch speed (px/frame at the 720px reference height). */
  power?: number;
  /** Downward acceleration (px/frame² at the 720px reference height). */
  gravity?: number;
  /** Base piece size in reference px. */
  size?: number;
  /** PRNG seed — same seed renders an identical burst every time. */
  seed?: number;
}

export interface Particle {
  angle: number;
  speed: number;
  color: string;
  size: number;
  rot0: number;
  spin: number;
  drift: number;
}

const DEFAULT_COLORS = [
  "#1d9bf0",
  "#ff5da2",
  "#ffd23f",
  "#22c55e",
  "#a855f7",
  "#ff7a45",
];

// --- Pure helpers (unit-tested) -------------------------------------------

/** Deterministic PRNG (mulberry32) — returns a function yielding [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build a deterministic particle set for a seed (stable across renders). */
export function makeParticles({
  count,
  seed,
  colors,
}: {
  count: number;
  seed: number;
  colors: string[];
}): Particle[] {
  const rand = mulberry32(seed);
  const palette = colors.length > 0 ? colors : DEFAULT_COLORS;
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2;
    const speed = 0.35 + 0.65 * rand();
    out.push({
      angle,
      speed,
      color: palette[Math.floor(rand() * palette.length)],
      size: 0.7 + 0.6 * rand(),
      rot0: rand() * Math.PI * 2,
      spin: (rand() - 0.5) * 0.6,
      drift: (rand() - 0.5) * 2,
    });
  }
  return out;
}

/** Opacity envelope over a particle's lifetime: quick fade-in, slow fade-out. */
export function particleOpacity(tt: number, lifetime: number): number {
  if (tt < 0 || tt > lifetime) return 0;
  const fadeIn = interpolate(tt, [0, 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(tt, [lifetime * 0.7, lifetime], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return Math.min(fadeIn, fadeOut);
}

// --- Component -------------------------------------------------------------

export function Confetti({
  particleCount = 140,
  colors = DEFAULT_COLORS,
  originX = 0.5,
  originY = 0.5,
  startFrame = 0,
  lifetime = 90,
  power = 17,
  gravity = 0.45,
  size = 13,
  seed = 1,
}: ConfettiProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const tt = frame - startFrame;
  if (tt < 0 || tt > lifetime) return null;

  const sc = height / 720;
  const ox = width * originX;
  const oy = height * originY;
  const particles = makeParticles({ count: particleCount, seed, colors });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {particles.map((p, i) => {
        const opacity = particleOpacity(tt, lifetime);
        if (opacity <= 0) return null;

        const vx = Math.cos(p.angle) * p.speed * power + p.drift;
        const vy = Math.sin(p.angle) * p.speed * power;
        const x = ox + vx * tt * sc;
        const y = oy + (vy * tt + 0.5 * gravity * tt * tt) * sc;
        const rot = p.rot0 + p.spin * tt;
        const flutter = Math.cos(p.rot0 + p.spin * tt * 1.6);
        const w = size * p.size * sc;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: w,
              height: w * 0.62,
              borderRadius: 2,
              background: p.color,
              opacity,
              transform: `translate(-50%, -50%) rotate(${rot}rad) scaleX(${flutter})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}
