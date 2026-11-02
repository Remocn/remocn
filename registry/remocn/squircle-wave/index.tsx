"use client";

import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface SquircleWaveProps {
  /** Colour of the wave's leading edge just behind the crest. */
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const EASE_IO = Easing.bezier(0.45, 0, 0.55, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_WAVE = Easing.bezier(0.3, 0, 0.45, 1);

// gradients.sh "limb" palette: #e9ecff, #8a8bff, #4b2bd6, #160c3a on #030308.
// It colours the wave's wake, the planet-edge ground and the R itself.
const THEMES = {
  dark: {
    bg: "#030308",
    ground: [
      "rgba(75,43,214,0.42)",
      "rgba(22,12,58,0.75)",
      "rgba(138,139,255,0.22)",
    ],
    idle: "#26263A",
    rest: "#1C1B2E",
    wake: "#4B2BD6",
    crest: "#E9ECFF",
    mark: ["#E9ECFF", "#B9BBFF", "#8A8BFF"],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    ground: [
      "rgba(138,139,255,0.3)",
      "rgba(233,236,255,0.6)",
      "rgba(75,43,214,0.16)",
    ],
    idle: "#D3D1D8",
    rest: "#E0DEE2",
    wake: "#8A8BFF",
    crest: "#2A1C7A",
    mark: ["#160C3A", "#4B2BD6", "#8A8BFF"],
    grain: 0.045,
  },
} as const;

const WAVE_START = 2;
const WAVE_END = 72;
const ANGLE = (16 * Math.PI) / 180;

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
const R_W = 124.06;
const R_H = 134.26;
/** Stem width of the R in path units: the grid pitch is half of it. */
const R_STEM = 19;

/** The R outline flattened to a polygon (path units), for point-in-mark tests. */
const R_POLY = (() => {
  const tokens = REMOCN_R_PATH.replace(/,/g, " ").trim().split(/\s+/);
  const pts: [number, number][] = [];
  let cmd = "";
  let i = 0;
  let cx = 0;
  let cy = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === "Z") break;
    if (cmd === "M" || cmd === "L") {
      cx = num();
      cy = num();
      pts.push([cx, cy]);
    } else if (cmd === "C") {
      const x1 = num();
      const y1 = num();
      const x2 = num();
      const y2 = num();
      const x3 = num();
      const y3 = num();
      for (let k = 1; k <= 8; k++) {
        const t = k / 8;
        const v = 1 - t;
        pts.push([
          v * v * v * cx +
            3 * v * v * t * x1 +
            3 * v * t * t * x2 +
            t * t * t * x3,
          v * v * v * cy +
            3 * v * v * t * y1 +
            3 * v * t * t * y2 +
            t * t * t * y3,
        ]);
      }
      cx = x3;
      cy = y3;
    }
  }
  return pts;
})();

/** Even-odd point-in-polygon test in R path units. */
function inMark(x: number, y: number) {
  let inside = false;
  for (let a = 0, b = R_POLY.length - 1; a < R_POLY.length; b = a++) {
    const [xa, ya] = R_POLY[a];
    const [xb, yb] = R_POLY[b];
    if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) {
      inside = !inside;
    }
  }
  return inside;
}

function squircle(cx: number, cy: number, r: number, q: number) {
  const N = 36;
  let d = "";
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const x = cx + Math.sign(c) * Math.abs(c) ** q * r;
    const y = cy + Math.sign(s) * Math.abs(s) ** q * r;
    d += `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${d}Z`;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={11}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function SquircleWave({
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: SquircleWaveProps) {
  const f = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const p = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const maskId = `m${uid}`;
  const fillId = `f${uid}`;

  // Mark size and a grid whose cells are half the stem wide, so the stem's
  // straight edges fall exactly on cell boundaries.
  const mu = (0.5 * H) / R_H;
  const P = (mu * R_STEM) / 2;
  const markLeft = W / 2 - (R_W / 2) * mu;
  const markTop = H / 2 - (R_H / 2) * mu;
  const ox = markLeft - Math.ceil(markLeft / P) * P;
  const oy = markTop - Math.ceil(markTop / P) * P;
  const cols = Math.ceil((W - ox) / P);
  const rows = Math.ceil((H - oy) / P);

  // Which cells touch the R: sample a 6×6 lattice inside each. Frame-free.
  const markCells = useMemo(() => {
    const set = new Set<number>();
    const cu = P / mu;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const mx0 = (ox + i * P - markLeft) / mu;
        const my0 = (oy + j * P - markTop) / mu;
        if (mx0 > R_W || my0 > R_H || mx0 + cu < 0 || my0 + cu < 0) continue;
        let hit = false;
        for (let a = 0; a < 6 && !hit; a++) {
          for (let b = 0; b < 6 && !hit; b++) {
            hit = inMark(
              mx0 + ((a + 0.5) / 6) * cu,
              my0 + ((b + 0.5) / 6) * cu,
            );
          }
        }
        if (hit) set.add(i * rows + j);
      }
    }
    return set;
  }, [P, mu, cols, rows, ox, oy, markLeft, markTop]);

  const cosA = Math.cos(ANGLE);
  const sinA = Math.sin(ANGLE);
  const half = (W / 2) * cosA + (H / 2) * sinA;
  // Enter just off-frame so the crest is on screen within a few frames, and
  // run far enough past the edge that the whole wake clears.
  const front = interpolate(
    f,
    [WAVE_START, WAVE_END],
    [-half - 90 * u, half + 420 * u],
    {
      ...CLAMP,
      easing: EASE_WAVE,
    },
  );
  const sigAhead = 70 * u;
  const sigBehind = 150 * u;

  const drift = interpolate(f, [0, WAVE_END + 40], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const r0 = 0.15 * P;
  const r1 = 0.43 * P;

  const shapes: React.ReactNode[] = [];
  const maskRects: React.ReactNode[] = [];

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x0 = ox + i * P;
      const y0 = oy + j * P;
      const cx = x0 + P / 2;
      const cy = y0 + P / 2;

      const mark = markCells.has(i * rows + j);

      const proj = (cx - W / 2) * cosA + (cy - H / 2) * sinA;
      const d = proj - front;
      const sig = d > 0 ? sigAhead : sigBehind;
      const m = Math.exp(-((d / sig) ** 2));
      const passed = interpolate(-d, [0, 2 * sigBehind], [0, 1], CLAMP);

      const dist = Math.hypot(cx - W / 2, cy - H / 2);
      const appear = interpolate(
        f,
        [dist / (60 * u), dist / (60 * u) + 9],
        [0, 1],
        {
          ...CLAMP,
          easing: EASE_OUT,
        },
      );

      const lock = mark
        ? interpolate(-d, [0.1 * sigBehind, 0.9 * sigBehind], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          })
        : 0;
      const shapeK = Math.max(
        m,
        mark ? Math.min(1, -d / (0.1 * sigBehind)) : 0,
      );
      const k = mark && d < 0 ? 1 : m;
      const r = (r0 + (r1 - r0) * k) * (0.6 + 0.4 * appear);
      const q = 1 - shapeK ** 0.7;
      // Behind the crest the wake cools through the accent and limb violet.
      const wake = d < 0 ? Math.exp(-((d / (1.6 * sigBehind)) ** 2)) : 0;
      const idle = interpolateColors(passed, [0, 1], [p.idle, p.rest]);
      const trail = interpolateColors(
        wake,
        [0, 0.55, 1],
        [idle, p.wake, accent],
      );
      const color = interpolateColors(m, [0, 1], [trail, p.crest]);
      const op = appear * (1 - lock);

      if (op > 0.002) {
        shapes.push(
          shapeK < 0.01 ? (
            <circle
              key={`c${i}-${j}`}
              cx={cx}
              cy={cy}
              r={r}
              fill={color}
              opacity={op}
            />
          ) : (
            <path
              key={`c${i}-${j}`}
              d={squircle(cx, cy, r, Math.max(0, q))}
              fill={mark && d < 0 ? p.mark[1] : color}
              opacity={op}
            />
          ),
        );
      }
      if (lock > 0) {
        const h = r1 + (P / 2 + 0.6 * u - r1) * lock;
        maskRects.push(
          <rect
            key={`m${i}-${j}`}
            x={cx - h}
            y={cy - h}
            width={2 * h}
            height={2 * h}
            fill="#FFFFFF"
          />,
        );
      }
    }
  }

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(70% 34% at ${50 + 3 * drift}% 104%, ${p.ground[2]} 0%, transparent 70%)`,
            `radial-gradient(95% 70% at ${50 + 3 * drift}% 118%, ${p.ground[0]} 0%, ${p.ground[1]} 45%, transparent 78%)`,
          ].join(", "),
        }}
      />
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={fillId}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={R_W * 0.6}
            y2={R_H}
          >
            <stop offset="0" stopColor={p.mark[0]} />
            <stop offset="0.55" stopColor={p.mark[1]} />
            <stop offset="1" stopColor={p.mark[2]} />
          </linearGradient>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            {maskRects}
          </mask>
        </defs>
        {shapes}
        <g mask={`url(#${maskId})`}>
          <g transform={`translate(${markLeft} ${markTop}) scale(${mu})`}>
            <path d={REMOCN_R_PATH} fill={`url(#${fillId})`} />
          </g>
        </g>
      </svg>
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
