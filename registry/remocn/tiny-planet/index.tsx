"use client";

import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type TinyPlanetColors = {
  sky: string;
  ground: string;
  near: string;
  far: string;
  window: string;
  sun: string;
};

export type TinyPlanetProps = {
  /** Buildings in the front row; the back row gets a matching count. */
  buildings?: number;
  seed?: number;
  /** Planet spin once bent, in degrees per frame at 30fps. */
  spin?: number;
  colors?: Partial<TinyPlanetColors>;
  /** Sky color. Overrides `colors.sky`. */
  skyColor?: string;
  /** Sun color. Overrides `colors.sun`. */
  sunColor?: string;
  /** Front-row building color. Overrides `colors.near`. */
  buildingColor?: string;
  /** Ground color. Overrides `colors.ground`. */
  groundColor?: string;
  speed?: number;
};

export const tinyPlanetDefaults = {
  buildings: 26,
  seed: 4,
  spin: 0.7,
  colors: {
    sky: "#111111",
    ground: "#262626",
    near: "#FFFFFF",
    far: "#6B6B6B",
    window: "#111111",
    sun: "#E5322D",
  } satisfies TinyPlanetColors,
  speed: 1,
};

const BEND_START = 8;
const BEND_END = 40;
const SPIN_RAMP = 14;

type Block = { s0: number; s1: number; h: number; row: 0 | 1; spire: number };

function makeCity(length: number, height: number, count: number, seed: number) {
  const blocks: Block[] = [];
  for (const row of [1, 0] as const) {
    const n = row === 1 ? Math.round(count * 0.8) : count;
    const slot = length / n;
    for (let i = 0; i < n; i++) {
      const key = `tiny-planet-${seed}-${row}-${i}`;
      const w = slot * (0.55 + random(`${key}-w`) * 0.4);
      const start =
        i * slot + random(`${key}-x`) * (slot - w) + (row ? slot * 0.5 : 0);
      const tall = random(`${key}-h`);
      const h = row
        ? height * (0.13 + tall * 0.16)
        : height * (0.05 + tall * tall * 0.15);
      const spire = random(`${key}-s`) < 0.18 ? height * 0.04 : 0;
      blocks.push({
        s0: start - length / 2,
        s1: start + w - length / 2,
        h,
        row,
        spire,
      });
    }
  }
  return blocks;
}

export function TinyPlanet({
  buildings = tinyPlanetDefaults.buildings,
  seed = tinyPlanetDefaults.seed,
  spin = tinyPlanetDefaults.spin,
  colors: colorOverrides,
  skyColor,
  sunColor,
  buildingColor,
  groundColor,
  speed = tinyPlanetDefaults.speed,
}: TinyPlanetProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const baseColors = { ...tinyPlanetDefaults.colors, ...colorOverrides };
  const colors = {
    ...baseColors,
    sky: skyColor ?? baseColors.sky,
    sun: sunColor ?? baseColors.sun,
    near: buildingColor ?? baseColors.near,
    ground: groundColor ?? baseColors.ground,
  };
  const t = (frame * speed * 30) / fps;

  // The skyline strip is exactly as long as the planet's circumference.
  const length = width;
  const radius = length / (2 * Math.PI);
  const city = useMemo(
    () => makeCity(length, height, Math.max(4, Math.round(buildings)), seed),
    [length, height, buildings, seed],
  );

  const bend = interpolate(t, [BEND_START, BEND_END], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  // Spin eases in while the strip closes, then turns at a steady rate.
  const spinT = Math.max(0, t - (BEND_END - SPIN_RAMP));
  const turn =
    spinT < SPIN_RAMP
      ? (spin * spinT * spinT) / (2 * SPIN_RAMP)
      : spin * (spinT - SPIN_RAMP / 2);
  const rot = (turn * Math.PI) / 180;

  const kappa = Math.max(1e-5, bend / radius);
  const horizon = height * 0.7;
  const tallest = height * 0.33;
  const finalScale = (height * 0.43) / (radius + tallest);
  const scale = 1 + (finalScale - 1) * bend;
  const anchorY = horizon + (height / 2 - finalScale * radius - horizon) * bend;

  // Bend: arc-length s and height h onto a circle of curvature kappa whose
  // top sits at the pivot. kappa -> 0 is the flat skyline.
  const map = (s: number, h: number): [number, number] => {
    const a = kappa * s + rot * bend;
    const rr = 1 / kappa + h;
    const x = Math.sin(a) * rr;
    const y = 1 / kappa - Math.cos(a) * rr;
    return [width / 2 + x * scale, anchorY + y * scale];
  };
  const P = (s: number, h: number) =>
    map(s, h)
      .map((v) => v.toFixed(1))
      .join(",");

  const steps = 160;
  const depth = Math.min(1 / kappa, height * 3);
  let ground = "";
  for (let i = 0; i <= steps; i++) {
    const s = -length / 2 + (length * i) / steps;
    ground += `${i ? "L" : "M"}${P(s, 0)}`;
  }
  for (let i = steps; i >= 0; i--) {
    const s = -length / 2 + (length * i) / steps;
    ground += `L${P(s, -depth)}`;
  }

  const sunX = interpolate(bend, [0, 1], [width * 0.7, width * 0.8]);
  const sunY = interpolate(bend, [0, 1], [height * 0.36, height * 0.2]);
  const sunR = height * interpolate(bend, [0, 1], [0.12, 0.075]);

  return (
    <AbsoluteFill style={{ backgroundColor: colors.sky, overflow: "hidden" }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <circle cx={sunX} cy={sunY} r={sunR} fill={colors.sun} />
        {city.map((b, i) => {
          const sub = 4;
          const top: string[] = [];
          for (let k = 0; k <= sub; k++)
            top.push(P(b.s0 + ((b.s1 - b.s0) * k) / sub, b.h));
          const mid = (b.s0 + b.s1) / 2;
          const spire = b.spire
            ? ` M${P(mid - 1.5, b.h)} L${P(mid, b.h + b.spire)} L${P(mid + 1.5, b.h)}`
            : "";
          const d = `M${P(b.s0, -2)} L${top.join(" L")} L${P(b.s1, -2)} Z${spire}`;
          return (
            <path
              key={i}
              d={d}
              fill={b.row ? colors.far : colors.near}
              stroke={b.row ? colors.far : colors.near}
              strokeWidth={b.spire ? 2 * scale : 0}
            />
          );
        })}
        {city.map((b, i) => {
          if (b.row || b.h < height * 0.09) return null;
          const cols = Math.max(1, Math.floor((b.s1 - b.s0) / (height * 0.03)));
          const rows = Math.floor(b.h / (height * 0.04));
          const cells: string[] = [];
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (random(`tiny-planet-${seed}-win-${i}-${r}-${c}`) < 0.55)
                continue;
              const s = b.s0 + ((b.s1 - b.s0) * (c + 0.5)) / cols;
              const h = b.h - height * 0.03 - r * height * 0.04;
              const ws = height * 0.006;
              cells.push(
                `M${P(s - ws, h)} L${P(s + ws, h)} L${P(s + ws, h - ws * 2.2)} L${P(s - ws, h - ws * 2.2)} Z`,
              );
            }
          }
          return (
            <path key={`w${i}`} d={cells.join(" ")} fill={colors.window} />
          );
        })}
        <path d={ground} fill={colors.ground} />
      </svg>
    </AbsoluteFill>
  );
}
