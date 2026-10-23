"use client";

import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type PhyllotaxisProps = {
  /** Number of seeds. */
  count?: number;
  /** Seed size multiplier. */
  size?: number;
  /** Frames for all seeds to spiral out. */
  growFrames?: number;
  /** Frames per pulse along the accent arm once grown. */
  pulseFrames?: number;
  /** Arm spacing: every n-th seed forms one parastichy (a Fibonacci number reads best). */
  arm?: number;
  /** Slow rotation of the head in degrees per second; 0 holds still. */
  rotation?: number;
  speed?: number;
  background?: string;
  color?: string;
  accent?: string;
};

export const phyllotaxisDefaults: Required<PhyllotaxisProps> = {
  count: 420,
  size: 1,
  growFrames: 60,
  pulseFrames: 45,
  arm: 21,
  rotation: 4,
  speed: 1,
  background: "#111111",
  color: "#FFFFFF",
  accent: "#E5322D",
};

const GOLDEN = (137.508 * Math.PI) / 180;
const POP = 10;
const pop = Easing.out(Easing.back(2.2));
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const fmt = (n: number) => Math.round(n * 10) / 10;
const dot = (x: number, y: number, r: number) =>
  `M ${fmt(x - r)} ${fmt(y)} a ${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(r * 2)} 0 a ${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(-r * 2)} 0 `;

export function Phyllotaxis({
  count = phyllotaxisDefaults.count,
  size = phyllotaxisDefaults.size,
  growFrames = phyllotaxisDefaults.growFrames,
  pulseFrames = phyllotaxisDefaults.pulseFrames,
  arm = phyllotaxisDefaults.arm,
  rotation = phyllotaxisDefaults.rotation,
  speed = phyllotaxisDefaults.speed,
  background = phyllotaxisDefaults.background,
  color = phyllotaxisDefaults.color,
  accent = phyllotaxisDefaults.accent,
}: PhyllotaxisProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const n = Math.max(1, Math.round(count));
  const step = Math.max(1, Math.round(arm));
  const time = frame * speed;
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) * 0.44;
  const c = maxR / Math.sqrt(n);
  const spin = (rotation * Math.PI * time) / 180 / fps;

  // Seeds appear in order with a little overshoot; the reveal eases so the
  // dense centre does not flash in all at once.
  const grown = (i: number) => {
    const at = growFrames * Math.sqrt(i / n);
    return pop(Math.min(1, Math.max(0, (time - at) / POP)));
  };
  const armIn = interpolate(time, [growFrames, growFrames + 14], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const since = time - growFrames - 10;
  const pulse = since > 0 ? (since / Math.max(1, pulseFrames)) % 1 : -1;

  let plain = "";
  let red = "";
  let spine = "";
  for (let i = 1; i <= n; i++) {
    const s = grown(i);
    if (s <= 0) continue;
    const radius = c * Math.sqrt(i);
    const theta = i * GOLDEN + spin;
    const x = cx + Math.cos(theta) * radius;
    const y = cy + Math.sin(theta) * radius;
    // Outer seeds are a touch larger, like a sunflower head.
    const base = c * 0.42 * size * (0.55 + 0.45 * Math.sqrt(i / n));
    const onArm = i % step === 0 && armIn > 0;
    if (!onArm) {
      plain += dot(x, y, base * s);
      continue;
    }
    // Pulse travels outward along the arm as a soft gaussian bump.
    const u = Math.sqrt(i / n);
    const bump =
      pulse >= 0 ? Math.exp(-(((u - pulse * 1.4 + 0.2) / 0.09) ** 2)) : 0;
    red += dot(x, y, base * s * (1 + 0.25 * armIn + bump * 0.9));
    spine += `${spine ? "L" : "M"} ${fmt(x)} ${fmt(y)} `;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Phyllotaxis spiral"
        style={{ display: "block" }}
      >
        <path d={plain} fill={color} />
        {spine ? (
          <path
            d={spine}
            fill="none"
            stroke={accent}
            strokeOpacity={0.35 * armIn}
            strokeWidth={Math.min(width, height) / 720}
          />
        ) : null}
        <path d={red} fill={color} fillOpacity={1 - armIn} />
        <path d={red} fill={accent} fillOpacity={armIn} />
      </svg>
    </AbsoluteFill>
  );
}
