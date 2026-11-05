"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600. */
function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: "0.76em", width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </div>
  );
}

export interface NumberMosaicProps {
  /**
   * The number that emerges from the field. Supports digits and `, . + % k K M x`;
   * other characters leave a gap.
   */
  value?: string;
  /** Text after the lockup, under the number. */
  label?: string;
  /** Product name in the lockup. */
  name?: string;
  /** Replaces the default remocn mark in the lockup. */
  logo?: React.ReactNode;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.18)",
    ink: [243, 242, 239],
    /** Alpha of the three resting tiers of the field. */
    tiers: [0.17, 0.28, 0.44],
    /** field brightness once the number has formed */
    rest: 0.36,
    /** gradients.sh "limb" (#e9ecff #8a8bff #4b2bd6 #160c3a), lit from the top right */
    tile: ["#4B2BD6", "#6A63FF", "#8A8BFF", "#D4D8FF"],
    /** digits printed on the lit tiles */
    print: [10, 10, 11],
    printAlpha: 0.5,
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.16)",
    ink: [18, 18, 20],
    tiers: [0.09, 0.15, 0.24],
    rest: 0.5,
    tile: ["#3A1FB8", "#4B2BD6", "#6A63F2", "#8A8BFF"],
    print: [255, 255, 255],
    printAlpha: 0.42,
    grain: 0.045,
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];

/* ------------------------------------------------------------------ */
/* Stroke font: each glyph is a few centrelines, inflated by STROKE.    */
/* Cap height is 1 unit, y grows downward.                              */
/* ------------------------------------------------------------------ */

type Pt = [number, number];
type Glyph = { advance: number; strokes: Pt[][] };

const STROKE = 0.25;
const R = STROKE / 2;
const DW = 0.62;
const TRACK = 0.1;
const CX = DW / 2;
const X0 = R;
const X1 = DW - R;
const Y0 = R;
const Y1 = 1 - R;

function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
  n = 36,
): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
}

const JUNCTION = 0.46;
const TOP_BOWL = { cy: (Y0 + JUNCTION) / 2, ry: (JUNCTION - Y0) / 2, rx: 0.19 };
const LOW_BOWL = {
  cy: (JUNCTION + Y1) / 2,
  ry: (Y1 - JUNCTION) / 2,
  rx: CX - R,
};
const BOWL = { cy: 0.655, ry: Y1 - 0.655, rx: CX - R };

const GLYPHS: Record<string, Glyph> = {
  "0": { advance: DW, strokes: [arc(CX, 0.5, CX - R, 0.5 - R, 0, 360, 56)] },
  "1": {
    advance: DW,
    strokes: [
      [
        [0.12, 0.25],
        [0.38, Y0],
        [0.38, Y1],
      ],
    ],
  },
  "2": {
    advance: DW,
    strokes: [
      [...arc(CX, 0.3, CX - R, 0.3 - R, 182, 395), [X0, Y1], [X1 + 0.01, Y1]],
    ],
  },
  "3": {
    advance: DW,
    strokes: [
      arc(CX - 0.01, TOP_BOWL.cy, TOP_BOWL.rx, TOP_BOWL.ry, 200, 450),
      arc(CX, LOW_BOWL.cy, LOW_BOWL.rx, LOW_BOWL.ry, 270, 520),
    ],
  },
  "4": {
    advance: DW,
    strokes: [
      [
        [0.46, Y1],
        [0.46, Y0],
        [X0, 0.69],
        [X1 + 0.03, 0.69],
      ],
    ],
  },
  "5": {
    advance: DW,
    strokes: [
      [
        [X1, Y0],
        [0.15, Y0],
        [0.12, 0.5],
      ],
      arc(CX, BOWL.cy, BOWL.rx, BOWL.ry, 208, 512),
    ],
  },
  "6": {
    advance: DW,
    strokes: [
      arc(CX, BOWL.cy, BOWL.rx, BOWL.ry, 0, 360, 56),
      [
        [0.47, Y0],
        [0.13, 0.6],
      ],
    ],
  },
  "7": {
    advance: DW,
    strokes: [
      [
        [X0, Y0],
        [X1, Y0],
        [0.22, Y1],
      ],
    ],
  },
  "8": {
    advance: DW,
    strokes: [
      arc(CX, TOP_BOWL.cy, TOP_BOWL.rx, TOP_BOWL.ry, 0, 360, 48),
      arc(CX, LOW_BOWL.cy, LOW_BOWL.rx, LOW_BOWL.ry, 0, 360, 48),
    ],
  },
  "9": {
    advance: DW,
    strokes: [
      arc(CX, 1 - BOWL.cy, BOWL.rx, BOWL.ry, 0, 360, 56),
      [
        [0.49, 0.4],
        [0.15, Y1],
      ],
    ],
  },
  ",": {
    advance: 0.26,
    strokes: [
      [
        [0.13, Y1 - 0.02],
        [0.07, Y1 + 0.14],
      ],
    ],
  },
  ".": {
    advance: 0.26,
    strokes: [
      [
        [0.13, Y1],
        [0.13, Y1],
      ],
    ],
  },
  "+": {
    advance: DW,
    strokes: [
      [
        [0.06, 0.56],
        [0.56, 0.56],
      ],
      [
        [CX, 0.31],
        [CX, 0.81],
      ],
    ],
  },
  "%": {
    advance: 0.86,
    strokes: [
      arc(0.2, 0.24, 0.1, 0.13, 0, 360, 28),
      arc(0.66, 0.76, 0.1, 0.13, 0, 360, 28),
      [
        [0.68, Y0],
        [0.18, Y1],
      ],
    ],
  },
  k: {
    advance: 0.6,
    strokes: [
      [
        [X0, Y0],
        [X0, Y1],
      ],
      [
        [0.5, 0.4],
        [X0, 0.74],
      ],
      [
        [0.24, 0.6],
        [0.5, Y1],
      ],
    ],
  },
  M: {
    advance: 0.84,
    strokes: [
      [
        [X0, Y1],
        [X0, Y0],
        [0.42, 0.66],
        [0.84 - R, Y0],
        [0.84 - R, Y1],
      ],
    ],
  },
  x: {
    advance: 0.56,
    strokes: [
      [
        [0.08, 0.4],
        [0.48, Y1],
      ],
      [
        [0.48, 0.4],
        [0.08, Y1],
      ],
    ],
  },
  " ": { advance: 0.3, strokes: [] },
};
GLYPHS.K = GLYPHS.k;

function layoutGlyphs(value: string) {
  const segs: Array<[number, number, number, number]> = [];
  let x = 0;
  const chars = Array.from(value);
  chars.forEach((ch, i) => {
    const g = GLYPHS[ch] ?? { advance: 0.4, strokes: [] };
    for (const s of g.strokes) {
      for (let k = 0; k < s.length - 1 || (s.length === 1 && k === 0); k++) {
        const a = s[k];
        const b = s[Math.min(k + 1, s.length - 1)];
        segs.push([a[0] + x, a[1], b[0] + x, b[1]]);
      }
    }
    x += g.advance + (i < chars.length - 1 ? TRACK : 0);
  });
  return { segs, width: x };
}

function segDist(px: number, py: number, s: [number, number, number, number]) {
  const [ax, ay, bx, by] = s;
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t =
    l2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  const qx = ax + dx * t - px;
  const qy = ay + dy * t - py;
  return Math.sqrt(qx * qx + qy * qy);
}

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/* ------------------------------------------------------------------ */

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
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const LIT_STEPS = 6;

/** Field running clock: ticks at full rate, then brakes to a stop. */
function fieldClock(t: number) {
  const a = 44;
  const b = 92;
  if (t <= a) return t;
  const d = Math.min(t, b) - a;
  return a + d - (d * d) / (2 * (b - a));
}

export function NumberMosaic({
  value = "10,000",
  label = "launch videos rendered",
  name = "remocn",
  logo,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: NumberMosaicProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const p: Palette = THEMES[theme];
  const gid = `m${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const cellW = 12 * u;
  const cellH = 16 * u;
  // overscan so the tilted plane never shows its edge
  const cols = Math.ceil((width * 1.16) / cellW);
  const rows = Math.ceil((height * 1.18) / cellH);
  const ox = (width - cols * cellW) / 2;
  const oy = (height - rows * cellH) / 2;

  const layout = useMemo(() => layoutGlyphs(value), [value]);
  const unit = Math.min((width * 0.84) / layout.width, height * 0.46);
  const numW = layout.width * unit;
  const numTop = height * 0.43 - unit * 0.56;
  const numLeft = (width - numW) / 2;

  // Per-cell constants: coverage by the big number, tier, tick rate, seed, light order.
  const cells = useMemo(() => {
    const feather = (0.55 * cellW) / unit;
    const out: Array<{
      cov: number;
      tier: number;
      rate: number;
      seed: number;
      start: number;
    }> = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const px = (ox + (c + 0.5) * cellW - numLeft) / unit;
        const py = (oy + (r + 0.5) * cellH - numTop) / unit;
        let cov = 0;
        if (px > -0.4 && px < layout.width + 0.4 && py > -0.4 && py < 1.4) {
          let d = 9;
          for (const s of layout.segs) d = Math.min(d, segDist(px, py, s));
          cov = Math.max(0, Math.min(1, (R + feather - d) / (2 * feather)));
        }
        const n1 = hash(i + 1);
        const n2 = hash(i * 3.7 + 11);
        const n3 = hash(i * 1.3 + 97);
        const xN = Math.max(0, Math.min(1, px / layout.width));
        out.push({
          cov,
          tier: n1 < 0.52 ? 0 : n1 < 0.86 ? 1 : 2,
          rate: n2 < 0.35 ? 0 : 1 / (5 + n2 * 14),
          seed: Math.floor(n3 * 10),
          start: 22 + xN * 26 + hash(i * 5.1 + 3) * 12,
        });
      }
    }
    return out;
  }, [rows, cols, cellW, cellH, ox, oy, unit, numLeft, numTop, layout]);

  // Global beats
  const enter = interpolate(t, [0, 16], [0.7, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const dim = interpolate(t, [26, 76], [1, p.rest], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const cam = interpolate(t, [0, 112], [0, 1], { ...CLAMP, easing: EASE_IO });
  const push = 1.08 - cam * 0.08;
  const rotY = -12 * (1 - cam);
  const rotX = 5 * (1 - cam);
  const clock = fieldClock(t);
  const lx = interpolate(t, [0, 130], [32, 66], CLAMP);
  const ly = 38 + Math.sin(t / 50) * 6;

  // Bucket every cell into a layer: 0..2 resting tiers, 3..(3+LIT_STEPS-1) lit steps.
  const layerCount = 3 + LIT_STEPS;
  const buckets: Array<Array<{ x: number[]; y: number; s: string }>> = [];
  for (let l = 0; l < layerCount; l++) buckets.push([]);
  // lit cells also get a solid tile, so the number reads as one shape
  const tiles: string[] = Array.from({ length: LIT_STEPS + 1 }, () => "");
  const tw = cellW - 1.6 * u;
  const th = cellH - 1.6 * u;
  for (let r = 0; r < rows; r++) {
    const rowChars: string[][] = [];
    const rowX: number[][] = [];
    for (let l = 0; l < layerCount; l++) {
      rowChars.push([]);
      rowX.push([]);
    }
    for (let c = 0; c < cols; c++) {
      const cell = cells[r * cols + c];
      const lit = interpolate(t, [cell.start, cell.start + 12], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      const v = cell.cov * lit;
      const step = Math.round(v * LIT_STEPS);
      // lit counters lock their digit as they light up
      const k =
        cell.cov > 0.5 ? Math.min(clock, fieldClock(cell.start + 4)) : clock;
      const digit = (cell.seed + Math.floor(k * cell.rate)) % 10;
      const layer = step === 0 ? cell.tier : 2 + step;
      if (step > 0) {
        const tx = ox + c * cellW + 0.8 * u;
        const ty = oy + r * cellH + 0.8 * u;
        tiles[step] +=
          `M${tx.toFixed(1)} ${ty.toFixed(1)}h${tw.toFixed(1)}v${th.toFixed(1)}h${(-tw).toFixed(1)}Z`;
      }
      rowChars[layer].push(String(digit));
      rowX[layer].push(ox + (c + 0.5) * cellW);
    }
    for (let l = 0; l < layerCount; l++) {
      if (rowChars[l].length)
        buckets[l].push({
          x: rowX[l],
          y: oy + (r + 0.5) * cellH + 4.2 * u,
          s: rowChars[l].join(""),
        });
    }
  }

  const ink = p.ink;
  // digits on a lit tile go from field ink to a print colour that sits on the gradient
  const litColor = (k: number) => {
    const f = k / LIT_STEPS;
    const a = p.tiers[2] * dim * (1 - f) + p.printAlpha * f;
    const c = ink.map((v, i) => Math.round(v + (p.print[i] - v) * f));
    return `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
  };
  // the gradient drifts a few % sideways over the shot
  const gDrift = interpolate(t, [0, 140], [-0.04, 0.04], CLAMP);

  // Label
  const lab = (d: number) =>
    interpolate(t, [84 + d, 108 + d], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const labelTop = numTop + unit * 1.08 + 30 * u;
  const band = interpolate(t, [74, 100], [0, 1], { ...CLAMP, easing: EASE_IO });

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          opacity: enter,
          perspective: 1600 * u,
          perspectiveOrigin: "50% 46%",
        }}
      >
        <AbsoluteFill
          style={{
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${push})`,
            transformOrigin: "50% 46%",
          }}
        >
          <svg
            width={width}
            height={height}
            style={{ position: "absolute", inset: 0, overflow: "visible" }}
            aria-hidden
          >
            <defs>
              <radialGradient
                id={gid}
                gradientUnits="userSpaceOnUse"
                cx={(lx / 100) * width}
                cy={(ly / 100) * height}
                r={width * 0.62}
              >
                <stop offset="0" stopColor="#fff" stopOpacity={1} />
                <stop offset="0.55" stopColor="#fff" stopOpacity={0.55} />
                <stop offset="1" stopColor="#fff" stopOpacity={0.22} />
              </radialGradient>
              <linearGradient
                id={`${gid}t`}
                gradientUnits="userSpaceOnUse"
                x1={numLeft + numW * gDrift}
                y1={numTop + unit}
                x2={numLeft + numW * (1 + gDrift)}
                y2={numTop}
              >
                {/* the accent opens the gradient; the rest is the palette */}
                {[accent, ...p.tile.slice(1)].map((col, k) => (
                  <stop
                    key={`${col}${k}`}
                    offset={k / (p.tile.length - 1)}
                    stopColor={col}
                  />
                ))}
              </linearGradient>
              <mask id={`${gid}k`}>
                <rect
                  x={-width * 0.1}
                  y={-height * 0.1}
                  width={width * 1.2}
                  height={height * 1.2}
                  fill={`url(#${gid})`}
                />
              </mask>
            </defs>
            <g fill={`url(#${gid}t)`}>
              {tiles.map((d, k) =>
                d ? (
                  <path
                    key={k}
                    d={d}
                    opacity={Math.min(1, (k / LIT_STEPS) * 1.15)}
                  />
                ) : null,
              )}
            </g>
            <g
              fontFamily={mono}
              fontSize={11 * u}
              textAnchor="middle"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              <g mask={`url(#${gid}k)`}>
                {[0, 1, 2].map((l) => (
                  <g
                    key={l}
                    fill={`rgba(${ink[0]},${ink[1]},${ink[2]},${(p.tiers[l] * dim).toFixed(3)})`}
                    fontWeight={400}
                  >
                    {buckets[l].map((row) => (
                      <text key={row.y} x={row.x.join(" ")} y={row.y}>
                        {row.s}
                      </text>
                    ))}
                  </g>
                ))}
              </g>
              {Array.from({ length: LIT_STEPS }, (_, i) => i + 1).map((k) => (
                <g
                  key={k}
                  fill={litColor(k)}
                  fontWeight={k >= LIT_STEPS - 2 ? 500 : 400}
                >
                  {buckets[2 + k].map((row) => (
                    <text key={row.y} x={row.x.join(" ")} y={row.y}>
                      {row.s}
                    </text>
                  ))}
                </g>
              ))}
            </g>
          </svg>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* quiet band behind the label so it reads over the field */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: labelTop - 34 * u,
          height: 104 * u,
          background: `radial-gradient(ellipse 34% 50% at 50% 50%, ${p.bg} 30%, transparent 100%)`,
          opacity: band,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: labelTop,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16 * u,
          fontFamily: sans,
          fontSize: 22 * u,
          lineHeight: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9 * u,
            opacity: lab(0),
            transform: `translateY(${(1 - lab(0)) * 14 * u}px)`,
          }}
        >
          {logo ??
            (name.trim().toLowerCase() === "remocn" ? (
              <RemocnLogo fontSize={27 * u} color={p.fg} />
            ) : (
              <span
                style={{
                  color: p.fg,
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  fontSize: 26 * u,
                }}
              >
                {name}
              </span>
            ))}
        </div>
        <div
          style={{
            width: Math.max(1, u),
            height: 22 * u,
            background: p.hair,
            transform: `scaleY(${lab(3)})`,
          }}
        />
        <span
          style={{
            color: p.muted,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            opacity: lab(6),
            transform: `translateY(${(1 - lab(6)) * 14 * u}px)`,
          }}
        >
          {label}
        </span>
      </div>

      {/* vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 75% at 50% 46%, transparent 55%, ${p.bg} 100%)`,
          opacity: 0.85,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
