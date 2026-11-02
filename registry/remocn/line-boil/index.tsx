"use client";

import { getLength, getPointAtLength } from "@remotion/paths";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type LineBoilColors = {
  line: string;
  fill: string;
  background: string;
};

export type LineBoilProps = {
  /** Closed outline as SVG path data, any coordinate space. Fitted to the frame. Defaults to a 5-point star. */
  path?: string;
  /** Frames each drawing holds before the next one ("on threes" by default). */
  boilEvery?: number;
  /** Distinct drawings the boil cycles through. */
  drawings?: number;
  /** Wobble strength; 1 is a gentle hand-drawn boil. */
  amplitude?: number;
  /** Base line weight in px at 720p. */
  strokeWidth?: number;
  /** Shape size as a fraction of the short frame side. */
  size?: number;
  colors?: Partial<LineBoilColors>;
  /** Outline color. Overrides `colors.line` when set. */
  line?: string;
  /** Shape fill. Overrides `colors.fill` when set. */
  fill?: string;
  /** Background. Overrides `colors.background` when set. */
  background?: string;
  speed?: number;
};

const starPath = (() => {
  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 100 : 40;
    const a = (-90 + i * 36) * (Math.PI / 180);
    return `${(100 + r * Math.cos(a)).toFixed(2)} ${(100 + r * Math.sin(a)).toFixed(2)}`;
  });
  return `M ${points.join(" L ")} Z`;
})();

export const lineBoilDefaults = {
  path: starPath,
  boilEvery: 3,
  drawings: 3,
  amplitude: 1,
  strokeWidth: 9,
  size: 0.66,
  colors: {
    line: "#111111",
    fill: "#E5322D",
    background: "#FFFFFF",
  } as LineBoilColors,
  speed: 1,
};

const SAMPLES = 160;
const DRAW_END = 22;
const FILL_START = 28;
const FILL_END = 40;
export const lineBoilLength = FILL_END;

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

type Point = { x: number; y: number };

// Low-frequency integer harmonics keep the closed loop seamless while giving
// the slow, rubbery wobble of a re-traced cel line.
function boil(points: Point[], seed: string, amp: number): Point[] {
  const harmonics = [2, 4, 9, 15].map((k, j) => ({
    k,
    weight: [1, 0.7, 0.45, 0.3][j],
    px: random(`${seed}-px-${k}`) * Math.PI * 2,
    py: random(`${seed}-py-${k}`) * Math.PI * 2,
  }));
  return points.map((p, i) => {
    const s = i / points.length;
    let dx = 0;
    let dy = 0;
    for (const h of harmonics) {
      dx += h.weight * Math.sin(Math.PI * 2 * h.k * s + h.px);
      dy += h.weight * Math.sin(Math.PI * 2 * h.k * s + h.py);
    }
    const nx = random(`${seed}-nx-${i}`) - 0.5;
    const ny = random(`${seed}-ny-${i}`) - 0.5;
    return {
      x: p.x + amp * (dx * 0.6 + nx * 0.14),
      y: p.y + amp * (dy * 0.6 + ny * 0.14),
    };
  });
}

export function LineBoil({
  path = lineBoilDefaults.path,
  boilEvery = lineBoilDefaults.boilEvery,
  drawings = lineBoilDefaults.drawings,
  amplitude = lineBoilDefaults.amplitude,
  strokeWidth = lineBoilDefaults.strokeWidth,
  size = lineBoilDefaults.size,
  colors,
  line: lineColor,
  fill: fillColor,
  background: backgroundColor,
  speed = lineBoilDefaults.speed,
}: LineBoilProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const merged = { ...lineBoilDefaults.colors, ...colors };
  const palette: LineBoilColors = {
    line: lineColor ?? merged.line,
    fill: fillColor ?? merged.fill,
    background: backgroundColor ?? merged.background,
  };
  const t = (frame / fps) * 30 * speed;
  const unit = Math.min(width, height) / 720;

  const base = useMemo(() => {
    const length = getLength(path);
    const raw = Array.from(
      { length: SAMPLES },
      (_, i) =>
        getPointAtLength(path, (length * i) / SAMPLES) ?? { x: 0, y: 0 },
    );
    const xs = raw.map((p) => p.x);
    const ys = raw.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const bw = Math.max(...xs) - minX;
    const bh = Math.max(...ys) - minY;
    const scale = (size * Math.min(width, height)) / Math.max(bw, bh, 1e-6);
    const ox = width / 2 - (bw * scale) / 2;
    const oy = height / 2 - (bh * scale) / 2;
    return raw.map((p) => ({
      x: ox + (p.x - minX) * scale,
      y: oy + (p.y - minY) * scale,
    }));
  }, [path, size, width, height]);

  const drawing =
    Math.floor(t / Math.max(1, boilEvery)) % Math.max(1, drawings);
  const amp = amplitude * 6.5 * unit;
  const line = boil(base, `line-boil-${drawing}`, amp);
  const fillShape = boil(base, `line-boil-fill-${drawing}`, amp * 1.4);

  const draw = interpolate(t, [0, DRAW_END], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const visible = Math.round(draw * SAMPLES);
  const fill = interpolate(t, [FILL_START, FILL_END], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.6)),
  });

  const cx = base.reduce((sum, p) => sum + p.x, 0) / base.length;
  const cy = base.reduce((sum, p) => sum + p.y, 0) / base.length;
  const pressurePhase = random(`line-boil-pressure-${drawing}`) * Math.PI * 2;

  return (
    <AbsoluteFill style={{ backgroundColor: palette.background }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Boiling hand-drawn outline"
      >
        {fill > 0 ? (
          <polygon
            points={fillShape.map((p) => `${p.x},${p.y}`).join(" ")}
            fill={palette.fill}
            transform={`translate(${cx} ${cy}) scale(${fill}) translate(${-cx} ${-cy})`}
          />
        ) : null}
        <g stroke={palette.line} strokeLinecap="round" fill="none">
          {line.slice(0, visible).map((p, i) => {
            const next = line[(i + 1) % line.length];
            const s = i / SAMPLES;
            const pressure =
              0.75 +
              0.25 * Math.sin(Math.PI * 2 * 3 * s + pressurePhase) +
              0.12 * Math.sin(Math.PI * 2 * 7 * s - pressurePhase);
            // Taper the pen in and out while the line is still being drawn.
            const taper =
              draw < 1 ? Math.min(1, (visible - i) / 10, (i + 4) / 10) : 1;
            return (
              <line
                key={i}
                x1={p.x}
                y1={p.y}
                x2={next.x}
                y2={next.y}
                strokeWidth={strokeWidth * unit * pressure * taper}
              />
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
}
