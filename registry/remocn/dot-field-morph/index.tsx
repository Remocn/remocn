"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { getLength, getPointAtLength, getSubpaths } from "@remotion/paths";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: MANROPE } = loadManrope("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

/**
 * Beat sheet (30fps, speed 1):
 * 0–14     a calm field of dots drifts across the frame.
 * 14–44    dots swirl in, centre first, into shape 1; label rises. Hold to 66.
 * 66–96    shape 2, hold to 118.  118–148 shape 3, hold to 170.
 * 170–206  the field gathers into the remocn.dev logo (R mark + "emocn").
 *          Hold to 250.
 * Dots take their colour from a slowly drifting gradients.sh "mesh" palette.
 */

export interface DotShapePart {
  /** SVG path data, any units. All parts of a shape share one coordinate space. */
  d: string;
  /** Sample along the outline with this width instead of filling (icon-style paths). */
  stroke?: number;
  /** Dots inside this part take the accent colour. */
  accent?: boolean;
  /** Fill rule for filled parts. Font outlines with overlapping contours need "nonzero". */
  fillRule?: "evenodd" | "nonzero";
}

/** A path string (filled, even-odd), one part, or several parts. */
export type DotShape = string | DotShapePart | DotShapePart[];

export interface DotFieldMorphProps {
  /** Shapes in order after the scattered field; the last one holds. */
  shapes?: DotShape[];
  /** Optional caption under each shape (same order). Empty string = none. */
  labels?: string[];
  /** 1,500–2,500 reads as a field; more costs render time. */
  count?: number;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

// ── Built-in shapes (100-unit icons, line style) ────────────────────────────

const ICON_MOTION: DotShapePart[] = [
  { d: "M60 50 m-21 0 a21 21 0 1 0 42 0 a21 21 0 1 0 -42 0" },
  { d: "M8 38 L30 38 M14 50 L32 50 M8 62 L30 62", stroke: 6.5 },
];

const ICON_TRANSITIONS: DotShapePart[] = [
  {
    // The back frame stops short of the front card, so it reads as behind it.
    d: "M27 68 H18 A8 8 0 0 1 10 60 V28 A8 8 0 0 1 18 20 H58 A8 8 0 0 1 66 28 V29",
    stroke: 6.5,
  },
  {
    d: "M42 36 H82 A8 8 0 0 1 90 44 V76 A8 8 0 0 1 82 84 H42 A8 8 0 0 1 34 76 V44 A8 8 0 0 1 42 36 Z",
  },
];

const ICON_CAPTIONS: DotShapePart[] = [
  {
    d: "M16 18 H84 A10 10 0 0 1 94 28 V64 A10 10 0 0 1 84 74 H40 L24 86 V74 H16 A10 10 0 0 1 6 64 V28 A10 10 0 0 1 16 18 Z",
    stroke: 6.5,
  },
  { d: "M26 40 H74 M26 54 H56", stroke: 6.5 },
];

// The remocn.dev logo: the R mark (0.76em, on the baseline) + "emocn" in
// Manrope 600 at -0.025em, outlined at 100 units per em. Glyph contours
// overlap (m, n, e's bar), so they fill nonzero.
const LOGO_R =
  "M 0.01 -75.54 C 0.01 -75.02 0.2 -74.42 0.62 -73.66 C 2.78 -69.75 7.61 -66.29 12.28 -65.3 C 12.99 -65.15 13.12 -65.15 29.09 -65.09 C 43.06 -65.04 45.3 -65.02 46.03 -64.92 C 50.88 -64.29 54.46 -62.03 56.26 -58.45 C 58.41 -54.17 58.04 -47.64 55.42 -43.69 C 53.58 -40.93 50.76 -39.21 47.13 -38.64 C 46.88 -38.6 39.73 -38.17 31.25 -37.68 C 14.05 -36.7 15.3 -36.81 13.69 -36.15 C 11.26 -35.16 8.4 -33.15 6.03 -30.78 C 2.75 -27.5 0.74 -23.97 0.14 -20.45 C 0.07 -20.04 0.05 -17.62 0.02 -9.96 L 0 0 5.38 0 L 10.76 0 10.78 -8.41 C 10.81 -17.54 10.8 -17.23 11.22 -18.8 C 12.33 -22.99 15.77 -25.76 20.63 -26.4 C 21.07 -26.45 22.31 -26.47 24.66 -26.45 C 28.37 -26.42 28.73 -26.38 30.13 -25.93 C 32.04 -25.3 33.78 -24 35.11 -22.18 C 35.39 -21.79 39.26 -17.21 43.7 -11.99 C 48.14 -6.78 51.87 -2.39 51.99 -2.23 C 52.12 -2.08 52.36 -1.65 52.54 -1.3 C 52.94 -0.52 53.27 -0.19 53.81 -0.07 C 54.06 -0.02 56.02 0 60.21 -0.02 L 66.24 -0.04 57.07 -11.99 C 52.03 -18.57 47.84 -24.05 47.77 -24.17 C 47.19 -25.12 47.36 -26.45 48.17 -27.32 C 48.56 -27.74 48.89 -27.92 49.85 -28.24 C 54.44 -29.74 58.96 -32.63 62.25 -36.17 C 68.26 -42.64 70.23 -50.91 67.61 -58.77 C 64.87 -67.05 57.7 -73.72 49.61 -75.53 C 47.51 -75.99 49.86 -75.95 23.69 -75.98 L 0.01 -76 0.01 -75.54 Z";

const LOGO_EMOCN = [
  // e
  "M105.2 1.5L105.2 1.5Q97.1 1.5 91 -2Q85 -5.6 81.6 -11.9Q78.2 -18.2 78.2 -26.6L78.2 -26.6Q78.2 -35.4 81.5 -41.9Q84.9 -48.4 90.8 -52Q96.8 -55.5 104.7 -55.5L104.7 -55.5Q112.9 -55.5 118.7 -51.7Q124.5 -47.9 127.4 -40.8Q130.3 -33.8 129.7 -24.1L129.7 -24.1L119.2 -24.1L119.2 -27.9Q119.1 -37.3 115.6 -41.8Q112.2 -46.3 105.1 -46.3L105.1 -46.3Q97.2 -46.3 93.3 -41.3Q89.3 -36.4 89.3 -27L89.3 -27Q89.3 -18.1 93.3 -13.2Q97.2 -8.3 104.7 -8.3L104.7 -8.3Q109.6 -8.3 113.1 -10.6Q116.7 -12.8 118.7 -16.9L118.7 -16.9L128.9 -13.7Q125.8 -6.5 119.4 -2.5Q113 1.5 105.2 1.5ZM124.5 -24.1L85.9 -24.1L85.9 -32.2L124.5 -32.2L124.5 -24.1Z",
  // m
  "M212 0L201.6 0L201.6 -33.6Q201.6 -39.5 198.6 -42.8Q195.6 -46.1 190.7 -46.1L190.7 -46.1Q187.7 -46.1 185.2 -44.7Q182.8 -43.3 181.2 -40.6Q179.7 -37.9 179.7 -33.8L179.7 -33.8L174.7 -36.3Q174.6 -42 177.1 -46.3Q179.6 -50.6 183.9 -53Q188.3 -55.4 193.7 -55.4L193.7 -55.4Q202.4 -55.4 207.3 -50.1Q212.1 -44.9 212.1 -36.1L212.1 -36.1L212 0ZM147.3 0L136.8 0L136.8 -54L146.1 -54L146.1 -38.4L147.3 -38.4L147.3 0ZM179.7 0L169.2 0L169.3 -33.5Q169.3 -39.4 166.3 -42.7Q163.3 -46.1 158.3 -46.1L158.3 -46.1Q153.3 -46.1 150.3 -42.7Q147.3 -39.3 147.3 -33.8L147.3 -33.8L142.3 -37Q142.3 -42.3 144.8 -46.4Q147.4 -50.6 151.8 -53Q156.1 -55.4 161.6 -55.4L161.6 -55.4Q167.3 -55.4 171.4 -52.9Q175.4 -50.5 177.6 -46.2Q179.7 -41.8 179.7 -36.1L179.7 -36.1L179.7 0Z",
  // o
  "M245.3 1.5L245.3 1.5Q237.2 1.5 231.3 -2.1Q225.3 -5.8 222.1 -12.2Q218.9 -18.7 218.9 -27.1L218.9 -27.1Q218.9 -35.5 222.2 -41.9Q225.5 -48.4 231.4 -51.9Q237.4 -55.5 245.3 -55.5L245.3 -55.5Q253.4 -55.5 259.4 -51.9Q265.3 -48.2 268.6 -41.8Q271.8 -35.4 271.8 -27.1L271.8 -27.1Q271.8 -18.6 268.6 -12.2Q265.3 -5.8 259.3 -2.1Q253.4 1.5 245.3 1.5ZM245.3 -8.3L245.3 -8.3Q253.1 -8.3 256.9 -13.6Q260.8 -18.8 260.8 -27.1L260.8 -27.1Q260.8 -35.5 256.9 -40.6Q253 -45.7 245.3 -45.7L245.3 -45.7Q240.1 -45.7 236.7 -43.3Q233.3 -40.9 231.6 -36.7Q230 -32.6 230 -27.1L230 -27.1Q230 -18.6 233.9 -13.5Q237.8 -8.3 245.3 -8.3Z",
  // c
  "M303.4 1.5L303.4 1.5Q295.1 1.5 289.3 -2.2Q283.5 -5.9 280.5 -12.4Q277.4 -18.8 277.3 -27L277.3 -27Q277.4 -35.4 280.5 -41.8Q283.7 -48.2 289.5 -51.9Q295.4 -55.5 303.6 -55.5L303.6 -55.5Q312.4 -55.5 318.7 -51.1Q325 -46.7 327 -39.1L327 -39.1L316.6 -36.1Q315 -40.6 311.5 -43.1Q308 -45.7 303.4 -45.7L303.4 -45.7Q298.3 -45.7 295 -43.2Q291.7 -40.8 290.1 -36.6Q288.5 -32.4 288.4 -27L288.4 -27Q288.5 -18.7 292.3 -13.5Q296 -8.3 303.4 -8.3L303.4 -8.3Q308.5 -8.3 311.6 -10.7Q314.8 -13 316.4 -17.4L316.4 -17.4L327 -14.9Q324.3 -7 318.3 -2.7Q312.1 1.5 303.4 1.5Z",
  // n
  "M383.2 0L372.6 0L372.6 -26.6Q372.6 -29.7 372.1 -33Q371.6 -36.4 370.1 -39.2Q368.6 -42.1 365.9 -43.8Q363.3 -45.6 358.9 -45.6L358.9 -45.6Q356.1 -45.6 353.6 -44.6Q351.1 -43.7 349.3 -41.7Q347.4 -39.6 346.3 -36.3Q345.3 -32.9 345.3 -28.1L345.3 -28.1L338.8 -30.6Q338.8 -37.9 341.5 -43.5Q344.3 -49.2 349.4 -52.3Q354.6 -55.5 361.8 -55.5L361.8 -55.5Q367.4 -55.5 371.3 -53.7Q375.1 -51.9 377.4 -48.9Q379.8 -46 381.1 -42.6Q382.3 -39.1 382.8 -35.8Q383.2 -32.5 383.2 -30L383.2 -30L383.2 0ZM345.3 0L334.6 0L334.6 -54L344 -54L344 -38.4L345.3 -38.4L345.3 0Z",
];

const WORDMARK: DotShapePart[] = [
  { d: LOGO_R, accent: true },
  ...LOGO_EMOCN.map((d) => ({ d, fillRule: "nonzero" as const })),
];

const DEFAULT_SHAPES: DotShape[] = [
  ICON_MOTION,
  ICON_TRANSITIONS,
  ICON_CAPTIONS,
  WORDMARK,
];
const DEFAULT_LABELS = ["Animations", "Transitions", "Captions", ""];

// ── Timing ──────────────────────────────────────────────────────────────────

const FIELD = 14;
const MORPH = 30;
const HOLD = 22;
const LAST_MORPH = 36;
/** Per-dot flight; the rest of the morph window is stagger. */
const FLIGHT = 0.62;

const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);

function morphStarts(shapeCount: number): number[] {
  const starts: number[] = [];
  let t = FIELD;
  for (let i = 0; i < shapeCount; i++) {
    starts.push(t);
    t += (i === shapeCount - 1 ? LAST_MORPH : MORPH) + HOLD;
  }
  return starts;
}

export const dotFieldMorphLength = (shapeCount = DEFAULT_SHAPES.length) =>
  morphStarts(shapeCount)[shapeCount - 1] + LAST_MORPH;

// ── Deterministic noise ─────────────────────────────────────────────────────

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const h = (a: number, b: number) => hash(a * 57.3 + b * 131.9);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const top = h(xi, yi) * (1 - u) + h(xi + 1, yi) * u;
  const bot = h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u;
  return top * (1 - v) + bot * v;
}

// ── Shape sampling ──────────────────────────────────────────────────────────

interface Pt {
  x: number;
  y: number;
  /** 0–1 brightness, encoded as dot size. */
  b: number;
  accent: boolean;
}

interface FlatPart {
  polys: [number, number][][];
  stroke?: number;
  accent: boolean;
  nonzero: boolean;
}

function normalizeShape(shape: DotShape): DotShapePart[] {
  if (typeof shape === "string") return [{ d: shape }];
  return Array.isArray(shape) ? shape : [shape];
}

function flatten(part: DotShapePart): FlatPart {
  const polys: [number, number][][] = [];
  for (const sub of getSubpaths(part.d)) {
    const len = getLength(sub);
    if (len <= 0) continue;
    const n = Math.max(8, Math.min(400, Math.ceil(len / 1.2)));
    const poly: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const p = getPointAtLength(sub, (len * i) / n);
      if (p) poly.push([p.x, p.y]);
    }
    polys.push(poly);
  }
  return {
    polys,
    stroke: part.stroke,
    accent: Boolean(part.accent),
    nonzero: part.fillRule === "nonzero",
  };
}

function segDist(px: number, py: number, poly: [number, number][]): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < poly.length - 1; i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
    const ex = ax + dx * t - px;
    const ey = ay + dy * t - py;
    const d = ex * ex + ey * ey;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

function insideNonzero(px: number, py: number, polys: [number, number][][]) {
  let wind = 0;
  for (const poly of polys) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (yi > py === yj > py) continue;
      const xc = ((xj - xi) * (py - yi)) / (yj - yi) + xi;
      if (px < xc) wind += yj > yi ? 1 : -1;
    }
  }
  return wind !== 0;
}

function insideEvenOdd(px: number, py: number, polys: [number, number][][]) {
  let inside = false;
  for (const poly of polys) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (
        yi > py !== yj > py &&
        px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }
  }
  return inside;
}

/** Returns brightness 0–1 if (x, y) is inside the part, else -1. */
function probe(part: FlatPart, x: number, y: number): number {
  if (part.stroke) {
    const hw = part.stroke / 2;
    let d = Number.POSITIVE_INFINITY;
    for (const poly of part.polys) d = Math.min(d, segDist(x, y, poly));
    if (d > hw) return -1;
    // Tube shading: bright along the centre-line, falling off to the edges.
    return 1 - (d / hw) ** 2 * 0.55;
  }
  const inside = part.nonzero
    ? insideNonzero(x, y, part.polys)
    : insideEvenOdd(x, y, part.polys);
  if (!inside) return -1;
  let d = Number.POSITIVE_INFINITY;
  for (const poly of part.polys) d = Math.min(d, segDist(x, y, poly));
  // Rim light on filled shapes: edges catch more light than the interior.
  return 0.7 + 0.3 * Math.max(0, 1 - d / 4);
}

function sampleShape(
  shape: DotShape,
  count: number,
  box: { cx: number; cy: number; w: number; h: number },
): Pt[] {
  const parts = normalizeShape(shape).map(flatten);
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const part of parts) {
    const pad = (part.stroke ?? 0) / 2;
    for (const poly of part.polys) {
      for (const [x, y] of poly) {
        minX = Math.min(minX, x - pad);
        minY = Math.min(minY, y - pad);
        maxX = Math.max(maxX, x + pad);
        maxY = Math.max(maxY, y + pad);
      }
    }
  }
  const bw = maxX - minX || 1;
  const bh = maxY - minY || 1;
  const scale = Math.min(box.w / bw, box.h / bh);

  const test = (
    x: number,
    y: number,
  ): { b: number; accent: boolean } | null => {
    let best = -1;
    let accent = false;
    for (const part of parts) {
      const b = probe(part, x, y);
      if (b > best) {
        best = b;
        accent = part.accent;
      }
    }
    return best < 0 ? null : { b: best, accent };
  };

  // Estimate filled area, then pick a hex-grid spacing that yields ~count dots.
  const coarse = 70;
  let hits = 0;
  for (let i = 0; i < coarse; i++) {
    for (let j = 0; j < coarse; j++) {
      if (
        test(minX + ((i + 0.5) / coarse) * bw, minY + ((j + 0.5) / coarse) * bh)
      )
        hits++;
    }
  }
  const area = Math.max(1, (hits / (coarse * coarse)) * bw * bh);
  let spacing = Math.sqrt(area / (count * 0.866));
  let pts: Pt[] = [];
  for (let attempt = 0; attempt < 4; attempt++) {
    pts = [];
    const rowH = spacing * 0.866;
    let row = 0;
    for (let y = minY + rowH / 2; y < maxY; y += rowH, row++) {
      const off = row % 2 ? spacing / 2 : 0;
      for (let x = minX + off + spacing / 2; x < maxX; x += spacing) {
        const k = pts.length + row * 7919;
        const jx = x + (hash(k * 1.7) - 0.5) * spacing * 0.35;
        const jy = y + (hash(k * 2.3) - 0.5) * spacing * 0.35;
        const hit = test(jx, jy);
        if (hit) pts.push({ x: jx, y: jy, b: hit.b, accent: hit.accent });
      }
    }
    if (pts.length >= count && pts.length < count * 1.2) break;
    spacing *= Math.sqrt(pts.length / count) * (pts.length < count ? 0.98 : 1);
  }
  // Exactly `count` dots: thin evenly, or double up with a small offset.
  const out: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const src = pts[Math.floor((i * pts.length) / count)] ?? pts[0];
    out.push(src);
  }
  const ox = box.cx - (minX + bw / 2) * scale;
  const oy = box.cy - (minY + bh / 2) * scale;
  // Key light from the upper left.
  return out.map((p, i) => {
    const nx = (p.x - minX) / bw;
    const ny = (p.y - minY) / bh;
    const light = 0.66 + 0.34 * (1 - (nx * 0.6 + ny * 0.4));
    const dup = i > 0 && out[i - 1] === p ? 1 : 0;
    return {
      x: p.x * scale + ox + dup * spacing * scale * 0.3,
      y: p.y * scale + oy + dup * spacing * scale * 0.3,
      b: Math.min(1, p.b * light),
      accent: p.accent,
    };
  });
}

function scatter(count: number, W: number, H: number): Pt[] {
  const cols = Math.round(Math.sqrt((count * W) / H));
  const rows = Math.ceil(count / cols);
  const pts: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = ((c + 0.15 + hash(i * 3.1) * 0.7) / cols) * W * 1.08 - W * 0.04;
    const y = ((r + 0.15 + hash(i * 5.7) * 0.7) / rows) * H * 1.08 - H * 0.04;
    const b = valueNoise(x / (W * 0.12), y / (H * 0.18)) ** 1.6;
    pts.push({ x, y, b: 0.12 + b * 0.75, accent: false });
  }
  return pts;
}

function hilbert(x: number, y: number, order = 128): number {
  let d = 0;
  let px = x;
  let py = y;
  for (let s = order / 2; s >= 1; s = Math.floor(s / 2)) {
    const rx = (px & s) > 0 ? 1 : 0;
    const ry = (py & s) > 0 ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);
    if (ry === 0) {
      if (rx === 1) {
        px = s - 1 - px;
        py = s - 1 - py;
      }
      const t = px;
      px = py;
      py = t;
    }
  }
  return d;
}

/**
 * Order points along a Hilbert curve over their own bounds, so dot i sits in
 * the same region of every shape: morphs read as one form reshaping, not a
 * swap.
 */
function bySpace(pts: Pt[]): Pt[] {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const p of pts) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const ox = minX - (span - (maxX - minX)) / 2;
  const oy = minY - (span - (maxY - minY)) / 2;
  return pts
    .map((p) => ({
      p,
      h: hilbert(
        Math.min(127, Math.floor(((p.x - ox) / span) * 128)),
        Math.min(127, Math.floor(((p.y - oy) / span) * 128)),
      ),
    }))
    .sort((m, n) => m.h - n.h)
    .map((m) => m.p);
}

// ── Component ───────────────────────────────────────────────────────────────

export function DotFieldMorph({
  shapes = DEFAULT_SHAPES,
  labels = DEFAULT_LABELS,
  count = 2000,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: DotFieldMorphProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const isLight = theme === "light";
  const bg = isLight ? "#F5F4F0" : "#0A0A0B";
  const ink = isLight ? "#141416" : "#EEEEF0";
  const n = Math.max(200, Math.round(count));
  const list = shapes.length ? shapes : DEFAULT_SHAPES;

  const states = useMemo(() => {
    const out: Pt[][] = [bySpace(scatter(n, W, H))];
    list.forEach((shape, i) => {
      const last = i === list.length - 1;
      const box = last
        ? { cx: W / 2, cy: H * 0.5, w: W * 0.64, h: H * 0.3 }
        : { cx: W / 2, cy: H * 0.45, w: H * 0.56, h: H * 0.5 };
      out.push(bySpace(sampleShape(shape, n, box)));
    });
    return out;
  }, [list, n, W, H]);

  const starts = morphStarts(list.length);
  // Which transition we are in (0 = still the field).
  let k = 0;
  for (let i = 0; i < starts.length; i++) if (frame >= starts[i]) k = i + 1;
  const from = states[k - 1] ?? states[0];
  const to = states[k] ?? states[0];
  const winLen = k === list.length ? LAST_MORPH : MORPH;
  const local = k === 0 ? 0 : (frame - starts[k - 1]) / winLen;

  const unit = Math.min(W, H) / 720;
  // Dark dots on a light stage read thinner, so they get a touch more size.
  const rMax = (isLight ? 2.05 : 1.85) * unit * Math.sqrt(2000 / n);
  const cx = W / 2;
  const cy = H * 0.47;
  const maxD = Math.hypot(W, H) / 2;

  // Paths bucketed by brightness and colour: a handful of <path>s, not 2,000 nodes.
  const BUCKETS = 5;
  const neutral: string[][] = Array.from({ length: BUCKETS }, () => []);
  const accented: string[][] = Array.from({ length: BUCKETS }, () => []);

  // The highlight that sweeps across a settled shape during each hold.
  const holdT = k === 0 ? -1 : (frame - starts[k - 1] - winLen) / HOLD;

  for (let i = 0; i < n; i++) {
    const a = from[i];
    const b = to[i];
    let x: number;
    let y: number;
    let bright: number;
    let acc: boolean;
    if (k === 0) {
      x = a.x + Math.sin(frame * 0.03 + i) * 1.5 - frame * 0.4;
      y = a.y + Math.cos(frame * 0.025 + i * 1.3) * 1.5;
      bright = a.b;
      acc = false;
    } else {
      // Stagger by distance: dots nearest the centre leave first.
      const d = Math.hypot(a.x - cx, a.y - cy) / maxD;
      const delay = Math.min(1, d * 0.75 + hash(i * 9.1) * 0.25) * (1 - FLIGHT);
      const t = Math.max(0, Math.min(1, (local - delay) / FLIGHT));
      const e = INOUT(t);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      // Curved flight: a consistent swirl, a little varied per dot.
      const curl = (0.16 + hash(i * 4.3) * 0.12) * Math.sin(Math.PI * e);
      x = a.x + dx * e - dy * curl;
      y = a.y + dy * e + dx * curl;
      bright = a.b + (b.b - a.b) * e;
      acc = e > 0.5 ? b.accent : a.accent;
      if (k === 1) x -= (FIELD + 0) * 0.4 * (1 - e);
    }
    // Idle shimmer + a soft diagonal sweep once a shape has settled.
    bright *= 0.9 + 0.1 * Math.sin(frame * 0.18 + hash(i * 1.9) * 6.28);
    if (holdT > -0.2 && holdT < 1.4) {
      const diag = (x / W) * 0.7 + (y / H) * 0.3;
      bright += 0.3 * Math.exp(-(((diag - (holdT * 1.2 - 0.1)) / 0.08) ** 2));
    }
    bright = Math.max(0, Math.min(1, bright));
    const r = rMax * (0.28 + 0.72 * bright);
    const bucket = Math.min(BUCKETS - 1, Math.floor(bright * BUCKETS));
    const seg = `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)} 0a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)} 0`;
    (acc ? accented : neutral)[bucket].push(seg);
  }

  // Slow push-in over the whole shot.
  const end = dotFieldMorphLength(list.length);
  const push = interpolate(frame, [0, end + 40], [1, 1.06], {
    easing: INOUT,
    extrapolateRight: "clamp",
  });

  // Caption under each settled shape.
  const label = k > 0 ? (labels[k - 1] ?? "") : "";
  const labelIn = interpolate(local, [0.72, 1.05], [0, 1], {
    easing: OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const nextStart = starts[k] ?? 1e6;
  const labelOut = interpolate(frame, [nextStart, nextStart + 8], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelOp = labelIn * labelOut;

  // gradients.sh "mesh" palette: bg #0a0d24, [#ecdcf2, #8796ee, #2e45b7, #0e1645].
  // It lives in the dots (a user-space gradient across the frame) and as a faint
  // navy pool in the ground. It drifts a few percent over the shot, never more.
  const drift = interpolate(frame, [0, end + 40], [0, 1], {
    extrapolateRight: "clamp",
  });
  const gx = W * (0.08 + drift * 0.06);
  const gy = H * (0.04 - drift * 0.04);
  const fieldStops = isLight
    ? ["#0B0B10", "#0e1645", "#1f3398", "#2e45b7"]
    : ["#FBF7FD", "#ecdcf2", "#aeb6f3", "#8796ee"];
  const markStops = isLight
    ? ["#2e45b7", accent, "#6f86ff"]
    : ["#c9d0ff", "#8796ee", accent];
  const ground = isLight
    ? `radial-gradient(70% 55% at ${46 + drift * 8}% 58%, rgba(236,220,242,0.55) 0%, rgba(236,220,242,0) 72%), radial-gradient(90% 80% at 50% 40%, #FBFAF7 0%, ${bg} 70%)`
    : `radial-gradient(55% 60% at ${62 - drift * 8}% 92%, rgba(46,69,183,0.16) 0%, rgba(46,69,183,0) 70%), radial-gradient(80% 75% at 50% 44%, #0d1130 0%, ${bg} 72%)`;

  return (
    <AbsoluteFill style={{ background: ground, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${push})`,
          transformOrigin: `${cx}px ${cy}px`,
        }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={`${uid}-field`}
            gradientUnits="userSpaceOnUse"
            x1={gx}
            y1={gy}
            x2={W - gx * 0.5}
            y2={H - gy}
          >
            {fieldStops.map((c, i) => (
              <stop
                key={c + String(i)}
                offset={i / (fieldStops.length - 1)}
                stopColor={c}
              />
            ))}
          </linearGradient>
          <linearGradient
            id={`${uid}-mark`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={H * 0.36}
            x2={0}
            y2={H * 0.64}
          >
            {markStops.map((c, i) => (
              <stop
                key={c + String(i)}
                offset={i / (markStops.length - 1)}
                stopColor={c}
              />
            ))}
          </linearGradient>
        </defs>
        {neutral.map((segs, i) =>
          segs.length ? (
            <path
              key={`n${i}`}
              d={segs.join("")}
              fill={`url(#${uid}-field)`}
              opacity={0.28 + (i / (BUCKETS - 1)) * 0.72}
            />
          ) : null,
        )}
        {accented.map((segs, i) =>
          segs.length ? (
            <path
              key={`a${i}`}
              d={segs.join("")}
              fill={`url(#${uid}-mark)`}
              opacity={0.6 + (i / (BUCKETS - 1)) * 0.4}
            />
          ) : null,
        )}
      </svg>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: H * 0.79,
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
            gap: H * 0.018,
            fontFamily: MANROPE,
            color: ink,
            opacity: labelOp,
            transform: `translateY(${(1 - labelIn) * H * 0.012}px)`,
            filter: `blur(${(1 - labelOp) * 4}px)`,
          }}
        >
          <span
            style={{
              fontWeight: 500,
              fontSize: H * 0.022,
              letterSpacing: "0.04em",
              fontVariantNumeric: "tabular-nums",
              color: isLight ? "#2e45b7" : "#8796ee",
            }}
          >
            {String(k).padStart(2, "0")}
          </span>
          <span
            style={{
              fontWeight: 400,
              fontSize: H * 0.042,
              letterSpacing: "-0.025em",
              opacity: 0.92,
            }}
          >
            {label}
          </span>
        </div>
      ) : null}
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        aria-hidden
      >
        <filter id={`${uid}-grain`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={0.85}
            numOctaves={2}
            seed={3}
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1 0"
          />
        </filter>
        <rect
          width={W}
          height={H}
          filter={`url(#${uid}-grain)`}
          opacity={isLight ? 0.05 : 0.06}
          style={{ mixBlendMode: isLight ? "multiply" : "screen" }}
        />
      </svg>
    </AbsoluteFill>
  );
}
