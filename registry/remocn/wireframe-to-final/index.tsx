"use client";

import { loadFont } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: mono } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

/** The remocn.dev "R" mark (viewBox 124.06 × 134.26). */
const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";
const R_ASPECT = 124.06 / 134.26;

/**
 * gradients.sh "pixel-glass" palette: bg #f4f3f1, [#7a3cff, #ff4fb8, #3d6bff].
 * It fills the chart series and blooms softly behind the finished screen.
 */
const GLASS = ["#3d6bff", "#7a3cff", "#ff4fb8"] as const;

export interface WireframeToFinalProps {
  /** Final screenshot. Without it a built-in abstract product pane is used. */
  src?: string;
  /** Blueprint stage. Off-white by default. */
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  /** Small caption under the screen, before and after the fill. Empty strings hide it. */
  captions?: [string, string];
  /** Numbers on the measurement lines: [width, height, sidebar]. */
  measurements?: [string, string, string];
}

/* ------------------------------------------------------------------ */
/* Abstract product pane geometry (1600 x 1000 design units).           */
/* ------------------------------------------------------------------ */

const VW = 1600;
const VH = 1000;

type Tone =
  | "side"
  | "card"
  | "block"
  | "strong"
  | "sel"
  | "accent"
  | "accentSoft";

type El =
  | {
      t: "r";
      x: number;
      y: number;
      w: number;
      h: number;
      r?: number;
      f?: Tone;
      s?: boolean | "accent";
    }
  | { t: "c"; x: number; y: number; r: number; f?: Tone }
  | { t: "l"; x: number; y: number; x2: number; y2: number }
  | { t: "p"; pts: [number, number][] }
  /** The remocn.dev logo: R mark + "emocn", `size` is the font size, (x, y) the baseline start. */
  | { t: "logo"; x: number; y: number; size: number };

function chrome(els: El[], active: number) {
  els.push({ t: "r", x: 0, y: 72, w: 288, h: VH - 72, f: "side" });
  els.push({ t: "l", x: 0, y: 72, x2: VW, y2: 72 });
  els.push({ t: "l", x: 288, y: 72, x2: 288, y2: VH });
  els.push({ t: "logo", x: 28, y: 46, size: 28 });
  els.push({ t: "r", x: 620, y: 20, w: 360, h: 32, r: 16, f: "block" });
  els.push({ t: "c", x: 1552, y: 36, r: 15, f: "block" });
  [118, 92, 136, 104, 84, 124, 98].forEach((w, i) => {
    const y = 112 + i * 50 + (i > 3 ? 36 : 0);
    const on = i === active;
    if (on)
      els.push({ t: "r", x: 16, y: y - 12, w: 256, h: 44, r: 10, f: "sel" });
    els.push({
      t: "r",
      x: 36,
      y,
      w: 20,
      h: 20,
      r: 6,
      f: on ? "strong" : "block",
    });
    els.push({
      t: "r",
      x: 70,
      y: y + 4,
      w,
      h: 12,
      r: 6,
      f: on ? "strong" : "block",
    });
  });
  els.push({ t: "r", x: 24, y: 920, w: 240, h: 52, r: 12, f: "card", s: true });
  els.push({ t: "c", x: 52, y: 946, r: 12, f: "block" });
  els.push({ t: "r", x: 76, y: 940, w: 110, h: 12, r: 6, f: "block" });
}

function header(els: El[], w: number) {
  els.push({ t: "r", x: 336, y: 116, w, h: 28, r: 8, f: "strong" });
  els.push({ t: "r", x: 336, y: 158, w: 200, h: 12, r: 6, f: "block" });
  els.push({ t: "r", x: 1300, y: 116, w: 116, h: 40, r: 10, s: true });
  els.push({ t: "r", x: 1432, y: 116, w: 120, h: 40, r: 10, f: "strong" });
}

const CHART: [number, number][] = [
  [0, 0.2],
  [0.1, 0.3],
  [0.2, 0.25],
  [0.3, 0.42],
  [0.4, 0.37],
  [0.5, 0.54],
  [0.6, 0.49],
  [0.7, 0.66],
  [0.8, 0.6],
  [0.9, 0.8],
  [1, 0.86],
];

function dashboard(): El[] {
  const els: El[] = [];
  chrome(els, 0);
  header(els, 300);
  const cw = (1216 - 48) / 3;
  [150, 118, 172].forEach((vw, i) => {
    const x = 336 + i * (cw + 24);
    els.push({ t: "r", x, y: 204, w: cw, h: 148, r: 16, f: "card", s: true });
    els.push({ t: "r", x: x + 24, y: 230, w: 96, h: 12, r: 6, f: "block" });
    els.push({ t: "r", x: x + 24, y: 262, w: vw, h: 34, r: 8, f: "strong" });
    els.push({ t: "r", x: x + 24, y: 316, w: 72, h: 12, r: 6, f: "block" });
  });
  els.push({
    t: "r",
    x: 336,
    y: 376,
    w: 800,
    h: 300,
    r: 16,
    f: "card",
    s: true,
  });
  els.push({ t: "r", x: 360, y: 402, w: 140, h: 12, r: 6, f: "block" });
  for (let k = 0; k < 4; k++)
    els.push({ t: "l", x: 360, y: 466 + k * 56, x2: 1112, y2: 466 + k * 56 });
  els.push({
    t: "p",
    pts: CHART.map(([px, py]) => [360 + px * 752, 634 - py * 168]),
  });
  els.push({
    t: "r",
    x: 1160,
    y: 376,
    w: 392,
    h: 300,
    r: 16,
    f: "card",
    s: true,
  });
  [170, 130, 190, 150, 120].forEach((w, k) => {
    const y = 404 + k * 52;
    els.push({ t: "c", x: 1196, y: y + 14, r: 13, f: "block" });
    els.push({ t: "r", x: 1222, y: y + 8, w, h: 12, r: 6, f: "block" });
    els.push({ t: "r", x: 1476, y: y + 8, w: 52, h: 12, r: 6, f: "strong" });
  });
  els.push({
    t: "r",
    x: 336,
    y: 700,
    w: 1216,
    h: 252,
    r: 16,
    f: "card",
    s: true,
  });
  els.push({ t: "l", x: 336, y: 748, x2: 1552, y2: 748 });
  [360, 680, 980, 1300].forEach((x) => {
    els.push({ t: "r", x, y: 718, w: 80, h: 10, r: 5, f: "block" });
  });
  for (let k = 0; k < 3; k++) {
    const y = 748 + k * 68;
    els.push({
      t: "r",
      x: 360,
      y: y + 28,
      w: [200, 160, 220][k],
      h: 12,
      r: 6,
      f: "strong",
    });
    els.push({ t: "r", x: 680, y: y + 28, w: 140, h: 12, r: 6, f: "block" });
    els.push({ t: "r", x: 980, y: y + 22, w: 84, h: 24, r: 12, f: "block" });
    els.push({
      t: "r",
      x: 1300,
      y: y + 28,
      w: [90, 110, 70][k],
      h: 12,
      r: 6,
      f: "block",
    });
    if (k < 2) els.push({ t: "l", x: 336, y: y + 68, x2: 1552, y2: y + 68 });
  }
  return els;
}

function smooth(pts: [number, number][]) {
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

const PALETTE = {
  light: {
    stage: "#F5F4F0",
    grid: "rgba(20,20,24,0.045)",
    gridMajor: "rgba(20,20,24,0.075)",
    ink: "rgba(20,20,24,0.5)",
    pane: "#FCFCFB",
    side: "#F6F6F4",
    card: "#FFFFFF",
    block: "rgba(20,20,24,0.06)",
    strong: "rgba(20,20,24,0.19)",
    sel: "rgba(20,20,24,0.045)",
    hair: "rgba(20,20,24,0.09)",
    logo: "#141418",
  },
  dark: {
    stage: "#0A0A0B",
    grid: "rgba(255,255,255,0.035)",
    gridMajor: "rgba(255,255,255,0.065)",
    ink: "rgba(255,255,255,0.5)",
    pane: "#18181B",
    side: "#151517",
    card: "#1E1E22",
    block: "rgba(255,255,255,0.075)",
    strong: "rgba(255,255,255,0.2)",
    sel: "rgba(255,255,255,0.06)",
    hair: "rgba(255,255,255,0.09)",
    logo: "#F3F2EF",
  },
};

function mixHex(a: string, b: string, t: number) {
  const parse = (h: string) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(h.trim());
    if (!m) return null;
    const n = Number.parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return a;
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
const OUT = Easing.bezier(0.22, 1, 0.36, 1);

// Timeline (frames at speed 1).
const FRAME_DRAW = [2, 28];
const DIM_DRAW = [12, 36];
const STRUCT_DRAW = 22;
const BOX_DRAW = [30, 62];
const CONTENT_DRAW = [42, 90];
const SWEEP = [104, 152];
const EDGE = 0.045;

type Drawn = El & {
  kind: "struct" | "box" | "content" | "bg";
  start: number;
  dur: number;
  /** Position along the sweep axis, 0..1. */
  at: number;
};

/** Center of an element along the "to bottom right" axis, 0..1. */
function diag(e: El) {
  let cx: number;
  let cy: number;
  if (e.t === "r") {
    cx = e.x + e.w / 2;
    cy = e.y + e.h / 2;
  } else if (e.t === "c") {
    cx = e.x;
    cy = e.y;
  } else if (e.t === "l") {
    cx = (e.x + e.x2) / 2;
    cy = (e.y + e.y2) / 2;
  } else if (e.t === "logo") {
    cx = e.x + e.size * 1.9;
    cy = e.y - e.size * 0.38;
  } else {
    cx = e.pts[Math.floor(e.pts.length / 2)][0];
    cy = e.pts[Math.floor(e.pts.length / 2)][1];
  }
  return (cx / VW + cy / VH) / 2;
}

function choreograph(): Drawn[] {
  return dashboard().map((e) => {
    const at = diag(e);
    const long =
      e.t === "l" && Math.abs(e.x2 - e.x) + Math.abs(e.y2 - e.y) > 600;
    if (e.t === "r" && e.f === "side")
      return { ...e, kind: "bg", start: 0, dur: 1, at };
    if (long) return { ...e, kind: "struct", start: STRUCT_DRAW, dur: 18, at };
    if (e.t === "r" && e.f === "card")
      return {
        ...e,
        kind: "box",
        start: BOX_DRAW[0] + at * (BOX_DRAW[1] - BOX_DRAW[0] - 16),
        dur: 16,
        at,
      };
    return {
      ...e,
      kind: "content",
      start: CONTENT_DRAW[0] + at * (CONTENT_DRAW[1] - CONTENT_DRAW[0] - 10),
      dur: e.t === "p" ? 22 : 10,
      at,
    };
  });
}

const ELS = choreograph();

export function WireframeToFinal({
  src,
  theme = "light",
  accent = "#3B5BFD",
  speed = 1,
  captions = ["Idea", "Product"],
  measurements = ["1440", "900", "288"],
}: WireframeToFinalProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const P = PALETTE[theme];
  const dark = theme === "dark";
  const k = width / 1280;
  const W = Math.round(width * 0.64);
  const H = Math.round(W * (VH / VW));
  const left = (width - W) / 2;
  const top = (height - H) / 2 - 10 * k;
  const s = W / VW;
  const line = dark ? mixHex(accent, "#FFFFFF", 0.3) : accent;
  const clamp = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;

  const draw = (start: number, dur: number) =>
    interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: OUT });

  // Fill sweep front along the "to bottom right" axis.
  const front = interpolate(frame, SWEEP, [-0.02, 1 + EDGE + 0.02], {
    ...clamp,
    easing: INOUT,
  });
  const sweepLife = interpolate(
    frame,
    [SWEEP[0], SWEEP[0] + 6, SWEEP[1] - 6, SWEEP[1]],
    [0, 1, 1, 0],
    clamp,
  );
  const after = interpolate(frame, [SWEEP[1] - 14, SWEEP[1] + 16], [0, 1], {
    ...clamp,
    easing: INOUT,
  });
  const push = interpolate(frame, [96, 230], [1, 1.05], {
    ...clamp,
    easing: INOUT,
  });
  const gridIn = interpolate(frame, [0, 14], [0.55, 1], clamp);
  const drift = interpolate(frame, [SWEEP[0], 230], [0, 1], clamp);
  const gridOp = gridIn * (1 - after * 0.55);
  const guides = 1 - after;

  const cropIn = interpolate(frame, [0, 14], [0.45, 1], {
    ...clamp,
    easing: OUT,
  });
  const filled = (t: number) => Math.min(1, Math.max(0, (front - t) / EDGE));
  const frameDraw = draw(FRAME_DRAW[0], FRAME_DRAW[1] - FRAME_DRAW[0]);
  const dimDraw = draw(DIM_DRAW[0], DIM_DRAW[1] - DIM_DRAW[0]);
  const labelIn = interpolate(
    frame,
    [DIM_DRAW[0] + 12, DIM_DRAW[1] + 4],
    [0, 1],
    clamp,
  );

  const maskStop = (front - EDGE) * 100;
  const mask = `linear-gradient(to bottom right, #000 ${maskStop}%, transparent ${front * 100}%)`;
  const gid = `${uid}-area`;
  const clipId = `${uid}-clip`;
  const radius = 28 * s;
  const tone = (f?: Tone) =>
    f === "accent" || f === "accentSoft" ? accent : f ? P[f] : "none";

  // Sweep front: the line x/W + y/H = 2 * (front - EDGE / 2).
  const fl = 2 * (front - EDGE / 2);
  const fx1 = fl * W + W;
  const fy1 = -H;
  const fx2 = fl * W - 2 * W;
  const fy2 = 2 * H;

  const capSwap = interpolate(frame, [SWEEP[0] + 18, SWEEP[0] + 34], [0, 1], {
    ...clamp,
    easing: INOUT,
  });
  const capIn = interpolate(frame, [26, 40], [0, 1], clamp);

  const tick = 6 * k;
  const gap = 26 * k;
  const label = {
    fontFamily: mono,
    fontSize: 11 * k,
    fill: line,
    letterSpacing: "0.04em",
  } as const;

  return (
    <AbsoluteFill style={{ background: P.stage, overflow: "hidden" }}>
      <Grid
        width={width}
        height={height}
        k={k}
        P={P}
        uid={uid}
        opacity={gridOp}
      />
      <AbsoluteFill
        style={{ transform: `scale(${push})`, transformOrigin: "50% 48%" }}
      >
        {/* pixel-glass underglow: the finished screen sits on a band of colour */}
        <div
          style={{
            position: "absolute",
            left: left + W * 0.06,
            top: top + H * 0.18,
            width: W * 0.88,
            height: H * 0.8,
            borderRadius: radius * 3,
            background: `linear-gradient(${100 + drift * 14}deg, ${GLASS[0]} 0%, ${GLASS[1]} 50%, ${GLASS[2]} 100%)`,
            filter: `blur(${70 * k}px)`,
            opacity: after * (dark ? 0.5 : 0.42),
            transform: `translateY(${(30 + 10 * after) * k}px)`,
          }}
        />
        {/* contact shadow, grows in once the screen is real */}
        <div
          style={{
            position: "absolute",
            left,
            top,
            width: W,
            height: H,
            borderRadius: radius,
            opacity: after,
            boxShadow: dark
              ? `0 0 0 1px rgba(255,255,255,0.09), 0 ${40 * k}px ${90 * k}px -${20 * k}px rgba(0,0,0,0.8)`
              : `0 0 0 1px rgba(20,20,24,0.07), 0 ${36 * k}px ${80 * k}px -${24 * k}px rgba(60,45,20,0.24), 0 ${4 * k}px ${12 * k}px -${4 * k}px rgba(60,45,20,0.08)`,
          }}
        />
        {/* final render, revealed by the diagonal sweep */}
        <div
          style={{
            position: "absolute",
            left,
            top,
            width: W,
            height: H,
            borderRadius: radius,
            overflow: "hidden",
            WebkitMaskImage: mask,
            maskImage: mask,
            background: P.pane,
          }}
        >
          {src ? (
            <Img
              src={src}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </div>
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", left, top, overflow: "visible" }}
        >
          <title>Wireframe</title>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
              {GLASS.map((c, i) => (
                <stop key={c} offset={i / (GLASS.length - 1)} stopColor={c} />
              ))}
            </linearGradient>
            <linearGradient id={`${gid}-fade`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.3} />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </linearGradient>
            <mask id={`${gid}-mask`} maskContentUnits="objectBoundingBox">
              <rect width={1} height={1} fill={`url(#${gid}-fade)`} />
            </mask>
            <clipPath id={clipId}>
              <rect width={W} height={H} rx={radius} />
            </clipPath>
          </defs>

          {/* final fills, region by region */}
          {src ? null : (
            <g clipPath={`url(#${clipId})`}>
              {ELS.map((e, i) => {
                const op = filled(e.at);
                if (op <= 0) return null;
                const key = `f${i}`;
                if (e.t === "l")
                  return (
                    <line
                      key={key}
                      x1={e.x * s}
                      y1={e.y * s}
                      x2={e.x2 * s}
                      y2={e.y2 * s}
                      stroke={P.hair}
                      opacity={op}
                    />
                  );
                if (e.t === "c")
                  return (
                    <circle
                      key={key}
                      cx={e.x * s}
                      cy={e.y * s}
                      r={e.r * s}
                      fill={tone(e.f)}
                      opacity={op}
                    />
                  );
                if (e.t === "logo") {
                  const rh = e.size * 0.76 * s;
                  return (
                    <g key={key} opacity={op}>
                      <path
                        d={REMOCN_R_PATH}
                        fill={P.logo}
                        transform={`translate(${e.x * s} ${e.y * s - rh}) scale(${rh / 134.26})`}
                      />
                      <text
                        x={e.x * s + rh * R_ASPECT + e.size * 0.04 * s}
                        y={e.y * s}
                        fill={P.logo}
                        style={{
                          fontFamily: manrope.fontFamily,
                          fontWeight: 600,
                          fontSize: e.size * s,
                          letterSpacing: "-0.025em",
                        }}
                      >
                        emocn
                      </text>
                    </g>
                  );
                }
                if (e.t === "p") {
                  const pts = e.pts.map(
                    ([x, y]) => [x * s, y * s] as [number, number],
                  );
                  const d = smooth(pts);
                  const base = 650 * s;
                  return (
                    <g key={key} opacity={op}>
                      <path
                        d={`${d} L ${pts[pts.length - 1][0]} ${base} L ${pts[0][0]} ${base} Z`}
                        fill={`url(#${gid})`}
                        mask={`url(#${gid}-mask)`}
                      />
                      <path
                        d={d}
                        fill="none"
                        stroke={`url(#${gid})`}
                        strokeWidth={Math.max(1.5, 3.4 * s)}
                        strokeLinecap="round"
                      />
                    </g>
                  );
                }
                return (
                  <rect
                    key={key}
                    x={e.x * s}
                    y={e.y * s}
                    width={e.w * s}
                    height={e.h * s}
                    rx={(e.r ?? 0) * s}
                    fill={tone(e.f)}
                    fillOpacity={e.f === "accentSoft" ? 0.16 : 1}
                    stroke={e.s ? P.hair : "none"}
                    opacity={op}
                  />
                );
              })}
            </g>
          )}

          {/* blueprint linework */}
          <g fill="none" stroke={line} strokeWidth={1}>
            <rect
              x={0.5}
              y={0.5}
              width={W - 1}
              height={H - 1}
              rx={radius}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - frameDraw}
              opacity={0.9 * (1 - after)}
            />
            {ELS.map((e, i) => {
              if (e.kind === "bg") return null;
              const p = draw(e.start, e.dur);
              if (p <= 0) return null;
              const op =
                (e.kind === "content" ? 0.75 : 0.9) *
                (1 - Math.min(1, Math.max(0, (front - e.at) / (EDGE * 1.6))));
              if (op <= 0.01) return null;
              const key = `b${i}`;
              const common = {
                pathLength: 1,
                strokeDasharray: "1 1",
                strokeDashoffset: 1 - p,
                opacity: op,
              };
              if (e.t === "l")
                return (
                  <line
                    {...common}
                    x1={e.x * s}
                    y1={e.y * s}
                    x2={e.x2 * s}
                    y2={e.y2 * s}
                  />
                );
              if (e.t === "c")
                return (
                  <circle
                    key={key}
                    {...common}
                    cx={e.x * s}
                    cy={e.y * s}
                    r={e.r * s}
                  />
                );
              if (e.t === "logo") {
                const rh = e.size * 0.76 * s;
                const xh = e.size * 0.555 * s;
                const tx = e.x * s + rh * R_ASPECT + e.size * 0.06 * s;
                return (
                  <g key={key}>
                    <path
                      {...common}
                      d={REMOCN_R_PATH}
                      vectorEffect="non-scaling-stroke"
                      transform={`translate(${e.x * s} ${e.y * s - rh}) scale(${rh / 134.26})`}
                    />
                    <rect
                      {...common}
                      x={tx}
                      y={e.y * s - xh}
                      width={e.size * 3.02 * s}
                      height={xh}
                      rx={xh / 2}
                    />
                  </g>
                );
              }
              if (e.t === "p")
                return (
                  <path
                    {...common}
                    d={smooth(
                      e.pts.map(([x, y]) => [x * s, y * s] as [number, number]),
                    )}
                  />
                );
              return (
                <rect
                  key={key}
                  {...common}
                  x={e.x * s + 0.5}
                  y={e.y * s + 0.5}
                  width={Math.max(0, e.w * s - 1)}
                  height={Math.max(0, e.h * s - 1)}
                  rx={(e.r ?? 0) * s}
                />
              );
            })}
          </g>

          {/* sweep front */}
          <g clipPath={`url(#${clipId})`} opacity={sweepLife}>
            <line
              x1={fx1}
              y1={fy1}
              x2={fx2}
              y2={fy2}
              stroke={line}
              strokeWidth={1.25}
            />
          </g>

          {/* measurements, crop marks and column ticks */}
          <g opacity={guides} stroke={line} strokeWidth={1} fill="none">
            {[
              [0, 0, -1, -1],
              [W, 0, 1, -1],
              [0, H, -1, 1],
              [W, H, 1, 1],
            ].map(([x, y, dx, dy]) => {
              const o = 10 * k;
              const L = 16 * k * cropIn;
              return (
                <path
                  key={`crop-${x}-${y}`}
                  d={`M ${x + dx * o} ${y + dy * (o + L)} L ${x + dx * o} ${y + dy * o} L ${x + dx * (o + L)} ${y + dy * o}`}
                  opacity={0.7}
                />
              );
            })}
            <g opacity={0.85}>
              <line x1={0} y1={-gap} x2={W * dimDraw} y2={-gap} />
              <line x1={0} y1={-gap - tick} x2={0} y2={-gap + tick} />
              <line
                x1={W}
                y1={-gap - tick}
                x2={W}
                y2={-gap + tick}
                opacity={dimDraw >= 0.99 ? 1 : 0}
              />
              <line x1={-gap} y1={0} x2={-gap} y2={H * dimDraw} />
              <line x1={-gap - tick} y1={0} x2={-gap + tick} y2={0} />
              <line
                x1={-gap - tick}
                y1={H}
                x2={-gap + tick}
                y2={H}
                opacity={dimDraw >= 0.99 ? 1 : 0}
              />
              <line x1={0} y1={H + gap} x2={288 * s * dimDraw} y2={H + gap} />
              <line x1={0} y1={H + gap - tick} x2={0} y2={H + gap + tick} />
              <line
                x1={288 * s}
                y1={H + gap - tick}
                x2={288 * s}
                y2={H + gap + tick}
                opacity={dimDraw >= 0.99 ? 1 : 0}
              />
            </g>
            {Array.from({ length: 13 }, (_, c) => {
              const x = (288 + (c * (VW - 288)) / 12) * s;
              const on = draw(DIM_DRAW[0] + 4 + c * 1.2, 8);
              return (
                <line
                  key={`col-${c}`}
                  x1={x}
                  y1={-4 * k}
                  x2={x}
                  y2={-4 * k - 5 * k * on}
                  opacity={0.55 * on}
                />
              );
            })}
          </g>
          <g opacity={guides * labelIn} style={label} stroke="none">
            <rect
              x={W / 2 - 24 * k}
              y={-gap - 8 * k}
              width={48 * k}
              height={16 * k}
              fill={P.stage}
            />
            <text x={W / 2} y={-gap + 4 * k} textAnchor="middle" fill={line}>
              {measurements[0]}
            </text>
            <rect
              x={-gap - 8 * k}
              y={H / 2 - 20 * k}
              width={16 * k}
              height={40 * k}
              fill={P.stage}
            />
            <text
              x={-gap + 4 * k}
              y={H / 2}
              textAnchor="middle"
              fill={line}
              transform={`rotate(-90 ${-gap + 4 * k} ${H / 2})`}
            >
              {measurements[1]}
            </text>
            <rect
              x={144 * s - 18 * k}
              y={H + gap - 8 * k}
              width={36 * k}
              height={16 * k}
              fill={P.stage}
            />
            <text
              x={144 * s}
              y={H + gap + 4 * k}
              textAnchor="middle"
              fill={line}
            >
              {measurements[2]}
            </text>
          </g>
        </svg>
      </AbsoluteFill>
      <Caption
        captions={captions}
        swap={capSwap}
        opacity={capIn}
        x={left + W}
        y={top + H + 18 * k}
        k={k}
        ink={P.ink}
        accent={line}
      />
    </AbsoluteFill>
  );
}

function Caption({
  captions,
  swap,
  opacity,
  x,
  y,
  k,
  ink,
  accent,
}: {
  captions: [string, string];
  swap: number;
  opacity: number;
  x: number;
  y: number;
  k: number;
  ink: string;
  accent: string;
}) {
  if (!captions[0] && !captions[1]) return null;
  const row = (n: number, text: string, p: number) => (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        display: "flex",
        gap: 10 * k,
        whiteSpace: "nowrap",
        opacity: p,
        transform: `translateY(${(1 - p) * (n === 1 ? -8 : 8) * k}px)`,
      }}
    >
      <span style={{ color: accent }}>{`0${n + 1}`}</span>
      <span>{text}</span>
    </div>
  );
  return (
    <div
      style={{
        position: "absolute",
        left: x - 300 * k,
        top: y,
        width: 300 * k,
        height: 16 * k,
        fontFamily: mono,
        fontSize: 11 * k,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: ink,
        opacity,
      }}
    >
      {row(0, captions[0], 1 - swap)}
      {row(1, captions[1], swap)}
    </div>
  );
}

function Grid({
  width,
  height,
  k,
  P,
  uid,
  opacity,
}: {
  width: number;
  height: number;
  k: number;
  P: (typeof PALETTE)["light"];
  uid: string;
  opacity: number;
}) {
  const minor = 24 * k;
  const major = minor * 5;
  const id = `${uid}-grid`;
  const idM = `${uid}-gridm`;
  const fade = `${uid}-fade`;
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, opacity }}
    >
      <title>Grid</title>
      <defs>
        <pattern
          id={id}
          width={minor}
          height={minor}
          patternUnits="userSpaceOnUse"
          x={width / 2}
          y={height / 2}
        >
          <path
            d={`M ${minor} 0 L 0 0 0 ${minor}`}
            fill="none"
            stroke={P.grid}
            strokeWidth={1}
          />
        </pattern>
        <pattern
          id={idM}
          width={major}
          height={major}
          patternUnits="userSpaceOnUse"
          x={width / 2}
          y={height / 2}
        >
          <path
            d={`M ${major} 0 L 0 0 0 ${major}`}
            fill="none"
            stroke={P.gridMajor}
            strokeWidth={1}
          />
        </pattern>
        <radialGradient id={fade} cx="50%" cy="50%" r="65%">
          <stop offset="0.55" stopColor={P.stage} stopOpacity={0} />
          <stop offset="1" stopColor={P.stage} stopOpacity={1} />
        </radialGradient>
      </defs>
      <rect width={width} height={height} fill={`url(#${id})`} />
      <rect width={width} height={height} fill={`url(#${idM})`} />
      <rect width={width} height={height} fill={`url(#${fade})`} />
    </svg>
  );
}
