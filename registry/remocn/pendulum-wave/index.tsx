"use client";

import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export type PendulumWaveProps = {
  /** Number of pendulums. */
  count?: number;
  /** Swings the slowest pendulum makes per loop; pendulum i makes cycles + i. */
  cycles?: number;
  /** Frames until every pendulum realigns. */
  loopFrames?: number;
  speed?: number;
  background?: string;
  /** Bobs and guides. */
  color?: string;
  /** The wave line threaded through the bobs. */
  accent?: string;
  /** Draw the faint per-pendulum tracks and centre line. */
  showGuides?: boolean;
};

export const pendulumWaveDefaults: Required<PendulumWaveProps> = {
  count: 15,
  cycles: 10,
  loopFrames: 450,
  speed: 1,
  background: "#111111",
  color: "#FFFFFF",
  accent: "#E5322D",
  showGuides: true,
};

const TAU = Math.PI * 2;
const SMEAR_FRAMES = 4;
const SMEAR_SAMPLES = 6;

type Point = { x: number; y: number };

const fmt = (n: number) => Math.round(n * 10) / 10;

// Catmull-Rom through the bobs so the wave reads as one continuous curve.
function smoothPath(points: Point[]) {
  if (points.length < 2) return "";
  let d = `M ${fmt(points[0].x)} ${fmt(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(p2.x)} ${fmt(p2.y)}`;
  }
  return d;
}

const circle = (x: number, y: number, r: number) =>
  `M ${fmt(x - r)} ${fmt(y)} a ${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(r * 2)} 0 a ${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(-r * 2)} 0`;

export function PendulumWave({
  count = pendulumWaveDefaults.count,
  cycles = pendulumWaveDefaults.cycles,
  loopFrames = pendulumWaveDefaults.loopFrames,
  speed = pendulumWaveDefaults.speed,
  background = pendulumWaveDefaults.background,
  color = pendulumWaveDefaults.color,
  accent = pendulumWaveDefaults.accent,
  showGuides = pendulumWaveDefaults.showGuides,
}: PendulumWaveProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const n = Math.max(2, Math.round(count));
  const loop = Math.max(1, loopFrames);
  const time = frame * speed;

  const marginX = width * 0.1;
  const gap = (width - marginX * 2) / (n - 1);
  const amp = height * 0.3;
  const cy = height / 2;
  const r0 = Math.min(gap * 0.3, height * 0.022);
  const unit = Math.min(width, height) / 720;

  // Phase of pendulum i: 2π · t · (cycles + i) / T. At t = 0 and t = T all
  // pendulums sit at the top extreme, so the loop closes on a straight line.
  const phaseAt = (i: number, t: number) => (TAU * t * (cycles + i)) / loop;

  const bobs = Array.from({ length: n }, (_, i) => {
    const c = Math.cos(phaseAt(i, time));
    // Fake depth: bobs swinging toward the viewer (lower) read slightly bigger.
    return { x: marginX + i * gap, y: cy - amp * c, r: r0 * (1 - 0.22 * c) };
  });

  let smear = "";
  for (let i = 0; i < n; i++) {
    const x = fmt(bobs[i].x);
    for (let s = 0; s <= SMEAR_SAMPLES; s++) {
      const t = time - (SMEAR_FRAMES * speed * s) / SMEAR_SAMPLES;
      const y = fmt(cy - amp * Math.cos(phaseAt(i, t)));
      smear += `${s === 0 ? "M" : "L"} ${x} ${y} `;
    }
  }

  const tracks = bobs
    .map((b) => `M ${fmt(b.x)} ${fmt(cy - amp)} V ${fmt(cy + amp)}`)
    .join(" ");
  const ticks = bobs
    .map(
      (b) =>
        circle(b.x, cy - amp, 2.2 * unit) + circle(b.x, cy + amp, 2.2 * unit),
    )
    .join(" ");

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Pendulum wave"
        style={{ display: "block" }}
      >
        {showGuides ? (
          <g stroke={color} fill="none">
            <path
              d={`M ${fmt(marginX - gap)} ${cy} H ${fmt(width - marginX + gap)}`}
              strokeOpacity={0.14}
              strokeWidth={unit}
            />
            <path
              d={tracks}
              strokeOpacity={0.08}
              strokeWidth={unit}
              strokeDasharray={`${2 * unit} ${6 * unit}`}
            />
            <path d={ticks} fill={color} fillOpacity={0.25} stroke="none" />
          </g>
        ) : null}
        <path
          d={smoothPath(bobs)}
          fill="none"
          stroke={accent}
          strokeWidth={2.5 * unit}
          strokeLinecap="round"
          strokeOpacity={0.85}
        />
        <path
          d={smear}
          fill="none"
          stroke={color}
          strokeOpacity={0.13}
          strokeWidth={r0 * 0.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={bobs.map((b) => circle(b.x, b.y, b.r)).join(" ")}
          fill={color}
        />
      </svg>
    </AbsoluteFill>
  );
}
