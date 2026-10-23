"use client";

import { useMemo } from "react";
import {
  AbsoluteFill,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type TopoLinesProps = {
  /** Number of contour levels. */
  levels?: number;
  /** Number of peaks in the height field (1 to 3 reads best). */
  peaks?: number;
  /** Contour drawn in the accent, counted from the lowest; -1 disables. */
  highlight?: number;
  /** Every n-th contour is a heavier index line; 0 disables. */
  indexEvery?: number;
  /** Sampling cells across the short side; higher is smoother and slower. */
  resolution?: number;
  /** Frames per seamless loop of the breathing field. */
  loopFrames?: number;
  seed?: number;
  speed?: number;
  background?: string;
  color?: string;
  accent?: string;
};

export const topoLinesDefaults: Required<TopoLinesProps> = {
  levels: 16,
  peaks: 3,
  highlight: 9,
  indexEvery: 4,
  resolution: 90,
  loopFrames: 300,
  seed: 2,
  speed: 1,
  background: "#111111",
  color: "#FFFFFF",
  accent: "#E5322D",
};

const TAU = Math.PI * 2;

// Cone height falls from 1 to 0 over this distance (short side = 1), so
// contours are evenly spaced like a real survey map.
const REACH = 0.95;
// Smooth-max softness: peaks merge into shared outer rings without creases.
const SOFT = 0.045;

type Peak = {
  x: number;
  y: number;
  amp: number;
  phase: number;
  orbit: number;
  lobes: [number, number];
};
type Ripple = { fx: number; fy: number; phase: number };

function makeTerrain(seed: number, peaks: number, w: number, h: number) {
  const r = (k: string) => random(`topo-lines-${seed}-${k}`);
  const m = Math.max(1, Math.round(peaks));
  const turn = r("turn") * TAU;
  const list: Peak[] = Array.from({ length: m }, (_, k) => {
    // Spread peaks around the centre so each keeps its own nest of rings.
    const a = turn + (k * TAU) / m + (r(`j${k}`) - 0.5) * 0.8;
    const spread = m === 1 ? 0.06 : 0.24 + r(`d${k}`) * 0.06;
    return {
      x: w / 2 + Math.cos(a) * spread * w,
      y: h / 2 + Math.sin(a) * spread * h * 1.1,
      amp: k === 0 ? 1 : 0.7 + r(`a${k}`) * 0.22,
      phase: r(`p${k}`) * TAU,
      orbit: 0.025 + r(`o${k}`) * 0.025,
      lobes: [r(`l2${k}`) * TAU, r(`l3${k}`) * TAU],
    };
  });
  const ripples: Ripple[] = Array.from({ length: 3 }, (_, k) => ({
    fx: (r(`rx${k}`) * 2 - 1) * (3 + k * 2),
    fy: (r(`ry${k}`) * 2 - 1) * (3 + k * 2),
    phase: r(`rp${k}`) * TAU,
  }));
  // Height at (x, y). `tau` walks once around a circle per loop: peaks drift
  // on small orbits, breathe, and their low harmonics rotate a whole number
  // of times, so the last frame matches the first.
  return (x: number, y: number, tau: number) => {
    let sum = 0;
    for (const p of list) {
      const px = p.x + Math.cos(tau + p.phase) * p.orbit;
      const py = p.y + Math.sin(tau + p.phase) * p.orbit;
      const dx = x - px;
      const dy = y - py;
      const theta = Math.atan2(dy, dx);
      const warp =
        1 +
        0.14 * Math.sin(2 * theta + p.lobes[0] + tau) +
        0.08 * Math.sin(3 * theta + p.lobes[1] - tau);
      const amp = p.amp * (1 + 0.05 * Math.sin(tau + p.phase));
      const v = amp - (Math.hypot(dx, dy) * warp) / REACH;
      sum += Math.exp(v / SOFT);
    }
    let v = SOFT * Math.log(sum);
    for (const q of ripples) {
      v +=
        0.03 *
        Math.sin(q.fx * x + q.fy * y + q.phase + Math.sin(tau + q.phase) * 1.4);
    }
    return v;
  };
}

const fmt = (n: number) => Math.round(n * 10) / 10;

export function TopoLines({
  levels = topoLinesDefaults.levels,
  peaks = topoLinesDefaults.peaks,
  highlight = topoLinesDefaults.highlight,
  indexEvery = topoLinesDefaults.indexEvery,
  resolution = topoLinesDefaults.resolution,
  loopFrames = topoLinesDefaults.loopFrames,
  seed = topoLinesDefaults.seed,
  speed = topoLinesDefaults.speed,
  background = topoLinesDefaults.background,
  color = topoLinesDefaults.color,
  accent = topoLinesDefaults.accent,
}: TopoLinesProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const unit = Math.min(width, height);
  const w = width / unit;
  const h = height / unit;
  const terrain = useMemo(
    () => makeTerrain(seed, peaks, w, h),
    [seed, peaks, w, h],
  );
  const tau = (TAU * frame * speed) / Math.max(1, loopFrames);

  const step = 1 / Math.max(20, resolution);
  const nx = Math.ceil(w / step) + 1;
  const ny = Math.ceil(h / step) + 1;
  const field = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      field[j * nx + i] = terrain(i * step, j * step, tau);
    }
  }

  const count = Math.max(1, Math.round(levels));
  const thresholds = Array.from(
    { length: count },
    (_, l) => 0.04 + (l * 0.9) / count,
  );
  const paths = { plain: "", index: "", accent: "" };
  const s = step * unit;
  const X = (i: number) => fmt(i * s);
  const Y = (j: number) => fmt(j * s);

  // Marching squares. Segments that share a cell edge land on the same
  // interpolated point, so round caps make them read as continuous curves.
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = field[j * nx + i];
      const b = field[j * nx + i + 1];
      const c = field[(j + 1) * nx + i + 1];
      const d = field[(j + 1) * nx + i];
      const lo = Math.min(a, b, c, d);
      const hi = Math.max(a, b, c, d);
      for (let l = 0; l < count; l++) {
        const t = thresholds[l];
        if (t < lo || t >= hi) continue;
        const code =
          (a > t ? 8 : 0) | (b > t ? 4 : 0) | (c > t ? 2 : 0) | (d > t ? 1 : 0);
        const top = () => `${X(i + (t - a) / (b - a))} ${Y(j)}`;
        const right = () => `${X(i + 1)} ${Y(j + (t - b) / (c - b))}`;
        const bottom = () => `${X(i + (t - d) / (c - d))} ${Y(j + 1)}`;
        const left = () => `${X(i)} ${Y(j + (t - a) / (d - a))}`;
        let seg = "";
        switch (code) {
          case 1:
          case 14:
            seg = `M ${left()} L ${bottom()} `;
            break;
          case 2:
          case 13:
            seg = `M ${bottom()} L ${right()} `;
            break;
          case 3:
          case 12:
            seg = `M ${left()} L ${right()} `;
            break;
          case 4:
          case 11:
            seg = `M ${top()} L ${right()} `;
            break;
          case 6:
          case 9:
            seg = `M ${top()} L ${bottom()} `;
            break;
          case 7:
          case 8:
            seg = `M ${left()} L ${top()} `;
            break;
          case 5:
            seg = `M ${left()} L ${top()} M ${bottom()} L ${right()} `;
            break;
          case 10:
            seg = `M ${top()} L ${right()} M ${left()} L ${bottom()} `;
            break;
        }
        if (l === highlight) paths.accent += seg;
        else if (indexEvery > 0 && (l + 1) % indexEvery === 0)
          paths.index += seg;
        else paths.plain += seg;
      }
    }
  }

  const px = unit / 720;
  return (
    <AbsoluteFill style={{ backgroundColor: background }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Topographic contour lines"
        style={{ display: "block" }}
      >
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d={paths.plain}
            stroke={color}
            strokeOpacity={0.38}
            strokeWidth={1.1 * px}
          />
          <path
            d={paths.index}
            stroke={color}
            strokeOpacity={0.85}
            strokeWidth={1.8 * px}
          />
          <path d={paths.accent} stroke={accent} strokeWidth={2.6 * px} />
        </g>
      </svg>
    </AbsoluteFill>
  );
}
