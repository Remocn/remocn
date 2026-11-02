"use client";

import { loadFont } from "@remotion/google-fonts/Manrope";
import { interpolatePath } from "@remotion/paths";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const WEIGHT = 500;
const display = loadFont("normal", { weights: ["500"], subsets: ["latin"] });

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
/** remocn.dev R mark: viewBox 124.06 x 134.26, set 0.76em tall on the baseline. */
const MARK_W = 124.06;
const MARK_H = 134.26;
const MARK_EM = 0.76;
const MARK_ADV = (MARK_EM * MARK_W) / MARK_H;
/** Gap between the mark and the next letter, as on the site header. */
const MARK_GAP = 0.04;

export interface ShapeMorphOProps {
  /** The word the shape lands in. Its first "o" (or O, 0, Q) becomes the shape. */
  word?: string;
  /**
   * Set a leading "r" as the remocn.dev R mark, so the default word reads as
   * the logo. Ignored when the word doesn't start with "r".
   */
  mark?: boolean;
  accent?: string;
  theme?: "dark" | "light";
  /** Playback multiplier. */
  speed?: number;
}

const THEMES = {
  dark: { bg: "#0A0A0B", fg: "#F3F2EF" },
  light: { bg: "#F5F4F0", fg: "#121214" },
} as const;

/** Points per outline. Every shape uses the same count so paths morph 1:1. */
const N = 192;
const PROBE = 600;
const TRACK = -0.02;
/** Minimum clear ink space between neighbouring glyphs, in em. */
const MIN_GAP = 0.03;

// Timeline (frames at speed 1).
const ENTER = 10;
const FIRST = 8;
const GAP = 16;
const MORPHS = 5;
const LAND = FIRST + MORPHS * GAP + 2;
const REVEAL = LAND + 9;
/** The counter opens once the word is out, after a short solid beat. */
const COUNTER = REVEAL + 15;
const COUNTER_LEN = 9;

/** Absolute rotation (deg) each shape settles at: circle, cookie, clover, burst, pill, square. */
const ROT = [0, 90, 135, 210, 270, 360];

const SPRING_MORPH = { damping: 15, stiffness: 150, mass: 0.8 };
const SPRING_LAND = { damping: 24, stiffness: 150, mass: 0.9 };
const SPRING_REVEAL = { damping: 19, stiffness: 120, mass: 0.8 };

type Pt = [number, number];

const softAbs = (v: number, e = 0.015) => Math.sqrt(v * v + e);

function polar(r: (a: number) => number, scale = 1): Pt[] {
  const out: Pt[] = [];
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2;
    const rr = r(a) * scale;
    out.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return out;
}

/** Distance from the origin to a closed convex outline along angle `a`. */
function rayToSdf(sdf: (x: number, y: number) => number, a: number) {
  let lo = 0;
  let hi = 3;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (sdf(Math.cos(a) * mid, Math.sin(a) * mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function pillSdf(x: number, y: number) {
  const r = 0.56;
  const half = 1.04 - r;
  const qx = Math.max(Math.abs(x) - half, 0);
  return Math.hypot(qx, y) - r;
}

function roundSquareSdf(x: number, y: number) {
  const half = 0.84;
  const rc = 0.3;
  const qx = Math.abs(x) - (half - rc);
  const qy = Math.abs(y) - (half - rc);
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    rc
  );
}

/** The expressive shape library, all in unit space (radius ~1). */
function buildShapes(): Pt[][] {
  const circle = polar(() => 1);
  // 8 broad scallops with tight valleys.
  const cookie = polar(
    (a) => 0.87 + 0.13 * softAbs(Math.cos(4 * a), 0.06) ** 0.75,
    1.02,
  );
  // 4 round leaves on the diagonals, pinched between.
  const clover = polar(
    (a) => 0.56 + 0.44 * softAbs(Math.cos(2 * a + Math.PI / 2), 0.03) ** 0.5,
    1.06,
  );
  // 10 soft points.
  const burst = polar(
    (a) => 0.85 + 0.15 * ((Math.cos(10 * a) + 1) / 2) ** 1.1,
    1.06,
  );
  const pill = polar((a) => rayToSdf(pillSdf, a));
  const square = polar((a) => rayToSdf(roundSquareSdf, a));
  return [circle, cookie, clover, burst, pill, square];
}

const f = (v: number) => (Math.abs(v) < 1e-9 ? "0" : v.toFixed(4));

/** Closed Catmull-Rom through the points, as N cubic segments. */
function toPath(pts: Pt[]) {
  const n = pts.length;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

interface Metrics {
  /** Pen x of every glyph, in em, tracking included. */
  pen: number[];
  /** Advance of every glyph, in em. */
  adv: number[];
  width: number;
  ascent: number;
  descent: number;
  slot: number;
  /** Slot glyph's ink centre relative to its pen / baseline, in em. */
  cx: number;
  cy: number;
  /** Half ink height of the slot glyph, in em. */
  halfH: number;
  /** Outer contour of the slot glyph, normalised so halfH = 1. */
  contour: Pt[];
  /** Its counter, same centre and scale; null if the glyph has none. */
  counter: Pt[] | null;
}

function findSlot(chars: string[], from: number) {
  for (const c of ["o", "O", "0", "Q"]) {
    const i = chars.indexOf(c, from);
    if (i >= 0) return i;
  }
  return Math.floor(chars.length / 2);
}

function measure(chars: string[], withMark: boolean): Metrics {
  const font = `${WEIGHT} ${PROBE}px "${display.fontFamily}"`;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) throw new Error("shape-morph-o: no 2d context");
  ctx.font = font;
  const w = (s: string) => ctx.measureText(s).width / PROBE;
  // With the mark, glyph 0 is the R and text metrics start at glyph 1.
  const lead = withMark ? 1 : 0;
  const m = ctx.measureText(chars.slice(lead).join(""));
  const slot = findSlot(chars, lead);

  const size = Math.ceil(PROBE * 1.6);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext("2d", { willReadFrequently: true });
  if (!g) throw new Error("shape-morph-o: no 2d context");
  const padX = Math.round(PROBE * 0.3);
  const base = Math.round(PROBE * 1.2);
  g.font = font;
  g.fillStyle = "#000";
  g.textBaseline = "alphabetic";
  const raster = (ch: string) => {
    g.clearRect(0, 0, size, size);
    g.fillText(ch, padX, base);
    return g.getImageData(0, 0, size, size).data;
  };

  // Per-row ink extents of every glyph, so neighbours never touch.
  const profiles = new Map<string, { l: Float32Array; r: Float32Array }>();
  for (const ch of new Set(chars.slice(lead))) {
    const px = raster(ch);
    const l = new Float32Array(size).fill(Number.NaN);
    const r = new Float32Array(size).fill(Number.NaN);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (px[(y * size + x) * 4 + 3] > 24) {
          if (Number.isNaN(l[y])) l[y] = (x - padX) / PROBE;
          r[y] = (x + 1 - padX) / PROBE;
        }
      }
    }
    profiles.set(ch, { l, r });
  }

  const pen: number[] = [];
  const adv: number[] = [];
  let push = 0;
  const origin = withMark ? MARK_ADV + MARK_GAP : 0;
  if (withMark) {
    adv.push(MARK_ADV);
    pen.push(0);
  }
  for (let i = lead; i < chars.length; i++) {
    adv.push(w(chars[i]));
    pen.push(
      origin +
        w(chars.slice(lead, i + 1).join("")) -
        adv[i] +
        (i - lead) * TRACK +
        push,
    );
    const a = profiles.get(chars[i - 1]);
    const b = profiles.get(chars[i]);
    if (i > lead && a && b) {
      let gap = Number.POSITIVE_INFINITY;
      for (let y = 0; y < size; y++) {
        const g0 = pen[i] + b.l[y] - (pen[i - 1] + a.r[y]);
        if (!Number.isNaN(g0)) gap = Math.min(gap, g0);
      }
      if (gap < MIN_GAP) {
        push += MIN_GAP - gap;
        pen[i] += MIN_GAP - gap;
      }
    }
  }

  // Rasterise the slot glyph and ray-cast its outer contour from the ink centre.
  const data = raster(chars[slot] ?? "o");
  const alpha = (x: number, y: number) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    if (x0 < 0 || y0 < 0 || x0 >= size - 1 || y0 >= size - 1) return 0;
    const fx = x - x0;
    const fy = y - y0;
    const at = (xx: number, yy: number) => data[(yy * size + xx) * 4 + 3] / 255;
    return (
      at(x0, y0) * (1 - fx) * (1 - fy) +
      at(x0 + 1, y0) * fx * (1 - fy) +
      at(x0, y0 + 1) * (1 - fx) * fy +
      at(x0 + 1, y0 + 1) * fx * fy
    );
  };
  let minX = size;
  let maxX = -1;
  let minY = size;
  let maxY = -1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (data[(y * size + x) * 4 + 3] > 127) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const cxPx = (minX + maxX + 1) / 2;
  const cyPx = (minY + maxY + 1) / 2;
  const halfPx = Math.max(1, (maxY - minY + 1) / 2);
  const rMax = Math.hypot(maxX - minX, maxY - minY) / 2 + 6;
  const contour: Pt[] = [];
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    let edge = 0;
    let prev = 0;
    for (let r = rMax; r > 0; r -= 0.5) {
      const v = alpha(cxPx + ca * r, cyPx + sa * r);
      if (v >= 0.5) {
        edge = r + (0.5 * (v - 0.5)) / Math.max(1e-6, v - prev);
        break;
      }
      prev = v;
    }
    contour.push([(ca * edge) / halfPx, (sa * edge) / halfPx]);
  }

  // Counter: march outward from the centre until the ray meets ink.
  let counter: Pt[] | null = null;
  if (alpha(cxPx, cyPx) < 0.5) {
    counter = [];
    for (let k = 0; k < N; k++) {
      const a = (k / N) * Math.PI * 2;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      let edge = 0;
      let prev = alpha(cxPx, cyPx);
      for (let r = 0.5; r < rMax; r += 0.5) {
        const v = alpha(cxPx + ca * r, cyPx + sa * r);
        if (v >= 0.5) {
          edge = r - (0.5 * (v - 0.5)) / Math.max(1e-6, v - prev);
          break;
        }
        prev = v;
      }
      counter.push([(ca * edge) / halfPx, (sa * edge) / halfPx]);
    }
  }

  return {
    pen,
    adv,
    width: pen[chars.length - 1] + adv[chars.length - 1],
    ascent: Math.max(m.actualBoundingBoxAscent / PROBE, withMark ? MARK_EM : 0),
    descent: m.actualBoundingBoxDescent / PROBE,
    slot,
    cx: (cxPx - padX) / PROBE,
    cy: (cyPx - base) / PROBE,
    halfH: halfPx / PROBE,
    contour,
    counter,
  };
}

function useMetrics(chars: string[], withMark: boolean) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("shape-morph-o: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      display.waitUntilDone(),
      document.fonts.load(`${WEIGHT} 100px "${display.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(chars, withMark));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [chars, withMark, handle]);
  return metrics;
}

/**
 * gradients.sh "mesh" palette laid inside the shape: a light-to-deep wash
 * that stays upright while the shape spins, plus one soft blob that drifts.
 * The accent is the middle stop.
 */
const MESH = {
  dark: { top: "#C9CCF6", blob: "#ECDCF2", blobAlpha: 0.7, deep: "#1D2A8F" },
  light: { top: "#8796EE", blob: "#ECDCF2", blobAlpha: 0.45, deep: "#1D2A8F" },
} as const;

export function ShapeMorphO({
  word = "remocn",
  mark = true,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: ShapeMorphOProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const chars = useMemo(() => Array.from(word), [word]);
  const withMark = mark && chars.length > 1 && /^r$/i.test(chars[0]);
  const m = useMetrics(chars, withMark);
  const shapes = useMemo(() => buildShapes().map(toPath), []);
  const oPath = useMemo(() => (m ? toPath(m.contour) : ""), [m]);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: c.bg }} />;
  }

  // Word layout.
  const F = Math.min((W * 0.66) / m.width, H * 0.36);
  const x0 = (W - m.width * F) / 2;
  const baseline = H / 2 + ((m.ascent - m.descent) / 2) * F;
  const oX = x0 + (m.pen[m.slot] + m.cx) * F;
  const oY = baseline + m.cy * F;
  const oHalf = m.halfH * F;

  // Shape chain: each morph starts from wherever the previous one was.
  const prog = (k: number) =>
    spring({
      frame: t - (FIRST + (k - 1) * GAP),
      fps,
      config: SPRING_MORPH,
    });
  let d = shapes[0];
  let rot = 0;
  for (let k = 1; k <= MORPHS; k++) {
    const start = FIRST + (k - 1) * GAP;
    const p = prog(k);
    rot += (ROT[k] - ROT[k - 1]) * p;
    if (t >= start) d = interpolatePath(p, d, shapes[k]);
  }
  const land = spring({ frame: t - LAND, fps, config: SPRING_LAND });
  if (t >= LAND) d = interpolatePath(land, d, oPath);

  // The counter eases open from the centre, turning the solid bowl into the letter.
  const open = interpolate(t, [COUNTER, COUNTER + COUNTER_LEN], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  if (m.counter && open > 0) {
    d += toPath(m.counter.map(([x, y]): Pt => [x * open, y * open]));
  }

  const R0 = Math.min(W, H) * 0.28;
  const enter = interpolate(t, [0, ENTER], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - (1 - x) ** 3,
  });
  const scale = interpolate(land, [0, 1], [R0, oHalf]) * (0.8 + 0.2 * enter);
  const sx = interpolate(land, [0, 1], [W / 2, oX]);
  const sy = interpolate(land, [0, 1], [H / 2, oY]);

  // Word halves slide out from behind the landed shape.
  const reveal = spring({ frame: t - REVEAL, fps, config: SPRING_REVEAL });
  const left = chars.slice(0, m.slot);
  const right = chars.slice(m.slot + 1);
  const leftSpan = m.slot > 0 ? oX - (x0 + m.pen[0] * F) + 4 : 0;
  const rightEnd =
    right.length > 0
      ? x0 + (m.pen[chars.length - 1] + m.adv[chars.length - 1]) * F
      : oX;
  const rightSpan = rightEnd - oX + 4;
  const dxL = (1 - reveal) * leftSpan;
  const dxR = -(1 - reveal) * rightSpan;

  const glyph = (ch: string, i: number, dx: number) => {
    if (i === 0 && withMark) {
      const k = (MARK_EM * F) / MARK_H;
      return (
        <path
          key="mark"
          d={REMOCN_R_PATH}
          fill={c.fg}
          transform={`translate(${x0 + m.pen[0] * F + dx} ${baseline - MARK_EM * F}) scale(${k})`}
        />
      );
    }
    return (
      <text
        key={`${i}-${ch}`}
        x={x0 + m.pen[i] * F + dx}
        y={baseline}
        fill={c.fg}
        style={{
          fontFamily: display.fontFamily,
          fontWeight: WEIGHT,
          fontSize: F,
          whiteSpace: "pre",
        }}
      >
        {ch}
      </text>
    );
  };

  // The mesh drifts a few percent over the shot, never enough to read as motion.
  const mesh = MESH[theme];
  const blobX = sx + (0.62 + Math.sin(t / 40) * 0.12) * scale;
  const blobY = sy + (-0.7 + Math.cos(t / 52) * 0.08) * scale;
  const tilt = Math.sin(t / 60) * 0.12;

  return (
    <AbsoluteFill style={{ background: c.bg }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <clipPath id={`l${uid}`}>
            <rect x={0} y={0} width={oX} height={H} />
          </clipPath>
          <clipPath id={`r${uid}`}>
            <rect x={oX} y={0} width={W - oX} height={H} />
          </clipPath>
          <clipPath id={`s${uid}`}>
            <path
              d={d}
              clipRule="evenodd"
              transform={`translate(${sx} ${sy}) rotate(${rot}) scale(${scale})`}
            />
          </clipPath>
          <linearGradient
            id={`w${uid}`}
            gradientUnits="userSpaceOnUse"
            x1={sx - (0.55 + tilt) * scale}
            y1={sy - scale}
            x2={sx + (0.55 + tilt) * scale}
            y2={sy + scale}
          >
            <stop offset="0" stopColor={mesh.top} />
            <stop
              offset="0.22"
              stopColor={interpolateColors(0.62, [0, 1], [mesh.top, accent])}
            />
            <stop offset="0.5" stopColor={accent} />
            <stop
              offset="0.78"
              stopColor={interpolateColors(0.55, [0, 1], [accent, mesh.deep])}
            />
            <stop offset="1" stopColor={mesh.deep} />
          </linearGradient>
          <radialGradient id={`b${uid}`}>
            <stop
              offset="0"
              stopColor={mesh.blob}
              stopOpacity={mesh.blobAlpha}
            />
            <stop offset="1" stopColor={mesh.blob} stopOpacity={0} />
          </radialGradient>
        </defs>
        {reveal > 0 && (
          <>
            <g clipPath={`url(#l${uid})`}>
              {left.map((ch, i) => glyph(ch, i, dxL))}
            </g>
            <g clipPath={`url(#r${uid})`}>
              {right.map((ch, i) => glyph(ch, m.slot + 1 + i, dxR))}
            </g>
          </>
        )}
        <g clipPath={`url(#s${uid})`}>
          <rect
            x={sx - scale * 1.6}
            y={sy - scale * 1.6}
            width={scale * 3.2}
            height={scale * 3.2}
            fill={`url(#w${uid})`}
          />
          <circle
            cx={blobX}
            cy={blobY}
            r={scale * 0.95}
            fill={`url(#b${uid})`}
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
}
