"use client";

import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Manrope: small labels (500) and the remocn.dev logo (600, the brand asset).
const { fontFamily: sans } = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});
const { fontFamily: display } = loadFraunces("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface PaperPlaneProps {
  /** The three stops the plane flies past. The last one labels the landing. */
  steps?: [string, string, string];
  /** Replaces the remocn.dev logo. The plane lands as a full stop after it. */
  logo?: React.ReactNode;
  /** Shown under the lockup once the plane has landed. */
  url?: string;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "light" | "dark";
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Frame the plane touches down. */
const LAND = 184;

const PAPER_TEX = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' seed='9' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.33  0 0 0 0 0.3  0 0 0 0.16 0'/></filter><rect width='240' height='240' filter='url(%23p)'/></svg>")`;

const THEMES = {
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#8A877F",
    card: "#FFFFFF",
    hair: "rgba(18,18,20,0.09)",
    line: "rgba(18,18,20,0.13)",
    block: "rgba(18,18,20,0.05)",
    trail: "rgba(18,18,20,0.42)",
    paper: [255, 255, 255],
    fold: [168, 162, 150],
    edge: "rgba(18,18,20,0.16)",
    shadow: "rgba(60,52,40,0.22)",
    cardShadow: "rgba(60,52,40,0.10)",
    texture: 1,
    grain: 0.035,
    stopInk: "#1d1c22",
  },
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#77767C",
    card: "#141416",
    hair: "rgba(255,255,255,0.08)",
    line: "rgba(255,255,255,0.14)",
    block: "rgba(255,255,255,0.06)",
    trail: "rgba(255,255,255,0.38)",
    paper: [246, 245, 242],
    fold: [96, 95, 100],
    edge: "rgba(255,255,255,0.0)",
    shadow: "rgba(0,0,0,0.85)",
    cardShadow: "rgba(0,0,0,0.5)",
    texture: 0,
    grain: 0.06,
    stopInk: "#F3F2EF",
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];

/**
 * gradients.sh ground, screen-fixed, drifting a little against the camera.
 * Light: "smear" (#efe8dc · #f2552c #f7b23b #e889b5). Dark: "rise" (sunrise
 * from the bottom: #fff1e2 #ff8a3d #a3301a #2a0d0a).
 */
function groundFill(theme: "light" | "dark", drift: number) {
  if (theme === "light") {
    const x = 70 - drift * 18;
    return [
      `radial-gradient(48% 62% at ${x}% 112%, color-mix(in oklab, #f7b23b 54%, transparent) 0%, transparent 72%)`,
      `radial-gradient(42% 58% at ${x + 26}% 104%, color-mix(in oklab, #e889b5 48%, transparent) 0%, transparent 70%)`,
      `radial-gradient(30% 34% at ${x - 6}% 118%, color-mix(in oklab, #f2552c 30%, transparent) 0%, transparent 72%)`,
      `radial-gradient(60% 50% at ${x - 40}% -10%, color-mix(in oklab, #efe8dc 90%, transparent) 0%, transparent 70%)`,
    ].join(", ");
  }
  const x = 58 - drift * 12;
  return [
    `radial-gradient(58% 40% at ${x}% 112%, #fff1e2 0%, #ff8a3d 22%, color-mix(in oklab, #a3301a 80%, transparent) 46%, color-mix(in oklab, #2a0d0a 70%, transparent) 70%, transparent 92%)`,
    `radial-gradient(110% 46% at ${x + 8}% 104%, color-mix(in oklab, #a3301a 22%, transparent) 0%, transparent 80%)`,
  ].join(", ");
}

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

// Manrope 600 metrics for the logo lockup (em units).
const LOGO_BASELINE = 0.883;
const LOGO_EMOCN = 3.147;
const LOGO_R = 0.76 * (124.06 / 134.26);
type V2 = { x: number; y: number };
type V3 = [number, number, number];

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

/* ------------------------------------------------------------------ */
/* Flight path: centripetal Catmull-Rom, resampled by arc length.        */
/* ------------------------------------------------------------------ */

function catmullRom(pts: V2[], per: number): V2[] {
  const ext = [
    { x: 2 * pts[0].x - pts[1].x, y: 2 * pts[0].y - pts[1].y },
    ...pts,
    {
      x: 2 * pts[pts.length - 1].x - pts[pts.length - 2].x,
      y: 2 * pts[pts.length - 1].y - pts[pts.length - 2].y,
    },
  ];
  const out: V2[] = [];
  const knot = (a: V2, b: V2) =>
    Math.hypot(b.x - a.x, b.y - a.y) ** 0.5 || 1e-4;
  for (let i = 0; i < ext.length - 3; i++) {
    const [p0, p1, p2, p3] = [ext[i], ext[i + 1], ext[i + 2], ext[i + 3]];
    const t0 = 0;
    const t1 = t0 + knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    const lerp = (a: V2, b: V2, ta: number, tb: number, t: number) => ({
      x: ((tb - t) / (tb - ta)) * a.x + ((t - ta) / (tb - ta)) * b.x,
      y: ((tb - t) / (tb - ta)) * a.y + ((t - ta) / (tb - ta)) * b.y,
    });
    for (let k = 0; k < per; k++) {
      const t = t1 + ((t2 - t1) * k) / per;
      const a1 = lerp(p0, p1, t0, t1, t);
      const a2 = lerp(p1, p2, t1, t2, t);
      const a3 = lerp(p2, p3, t2, t3, t);
      const b1 = lerp(a1, a2, t0, t2, t);
      const b2 = lerp(a2, a3, t1, t3, t);
      out.push(lerp(b1, b2, t1, t2, t));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

interface Track {
  pts: V2[];
  len: number[];
  total: number;
}

function buildTrack(pts: V2[]): Track {
  const dense = catmullRom(pts, 40);
  const len = [0];
  for (let i = 1; i < dense.length; i++) {
    len.push(
      len[i - 1] +
        Math.hypot(dense[i].x - dense[i - 1].x, dense[i].y - dense[i - 1].y),
    );
  }
  return { pts: dense, len, total: len[len.length - 1] };
}

function sampleTrack(tr: Track, s: number) {
  const d = Math.min(tr.total, Math.max(0, s));
  let lo = 0;
  let hi = tr.len.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (tr.len[mid] < d) lo = mid;
    else hi = mid;
  }
  const seg = tr.len[hi] - tr.len[lo] || 1;
  const f = (d - tr.len[lo]) / seg;
  const a = tr.pts[lo];
  const b = tr.pts[hi];
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
}

function headingAt(tr: Track, s: number) {
  const a = sampleTrack(tr, s - 6);
  const b = sampleTrack(tr, s + 6);
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/** Glide speed: already airborne at frame 0, eases off into the landing. */
function velocity(t: number) {
  return interpolate(t, [LAND - 36, LAND], [1, 0.14], {
    ...CLAMP,
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
}

function buildDistance() {
  const table = [0];
  let sum = 0;
  for (let i = 1; i <= LAND * 2; i++) {
    sum += velocity((i - 0.5) / 2) / 2;
    table.push(sum);
  }
  return table.map((v) => v / sum);
}

/* ------------------------------------------------------------------ */
/* The plane: six flat-shaded facets, re-projected every frame.          */
/* ------------------------------------------------------------------ */

const NOSE: V3 = [1, 0, 0];
const TAIL: V3 = [-0.62, 0, 0];
const FOLD_L: V3 = [-0.66, -0.2, 0.03];
const FOLD_R: V3 = [-0.66, 0.2, 0.03];
const TIP_L: V3 = [-0.7, -0.56, 0.14];
const TIP_R: V3 = [-0.7, 0.56, 0.14];
const KEEL_L: V3 = [-0.6, -0.025, -0.2];
const KEEL_R: V3 = [-0.6, 0.025, -0.2];

const FACETS: V3[][] = [
  [NOSE, TAIL, FOLD_L],
  [NOSE, FOLD_L, TIP_L],
  [NOSE, FOLD_R, TAIL],
  [NOSE, TIP_R, FOLD_R],
  [NOSE, KEEL_L, TAIL],
  [NOSE, TAIL, KEEL_R],
];

const LIGHT: V3 = (() => {
  const l: V3 = [-0.45, -0.75, 0.62];
  const m = Math.hypot(...l);
  return [l[0] / m, l[1] / m, l[2] / m];
})();

function cross(a: V3, b: V3): V3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

interface Facet {
  pts: string;
  shadowPts: string;
  z: number;
  lit: number;
}

function planeFacets(
  heading: number,
  bank: number,
  tilt: number,
  size: number,
  lift: V2,
): Facet[] {
  const f: V3 = [Math.cos(heading), Math.sin(heading), 0];
  // "up" is perpendicular to the path in the screen, tilted toward the viewer
  const up0: V3 = [
    Math.sin(heading) * Math.cos(tilt),
    -Math.cos(heading) * Math.cos(tilt),
    Math.sin(tilt),
  ];
  const side0 = cross(f, up0);
  const up: V3 = [
    up0[0] * Math.cos(bank) + side0[0] * Math.sin(bank),
    up0[1] * Math.cos(bank) + side0[1] * Math.sin(bank),
    up0[2] * Math.cos(bank) + side0[2] * Math.sin(bank),
  ];
  const right = cross(f, up);
  const world = (v: V3): V3 => [
    (v[0] * f[0] + v[1] * right[0] + v[2] * up[0]) * size,
    (v[0] * f[1] + v[1] * right[1] + v[2] * up[1]) * size,
    (v[0] * f[2] + v[1] * right[2] + v[2] * up[2]) * size,
  ];
  return FACETS.map((tri) => {
    const w = tri.map(world);
    const persp = (p: V3) => 1 + p[2] / (size * 9);
    const pts = w
      .map(
        (p) =>
          `${(p[0] * persp(p)).toFixed(2)},${(p[1] * persp(p)).toFixed(2)}`,
      )
      .join(" ");
    const shadowPts = w
      .map((p) => `${(p[0] + lift.x).toFixed(2)},${(p[1] + lift.y).toFixed(2)}`)
      .join(" ");
    const e1: V3 = [w[1][0] - w[0][0], w[1][1] - w[0][1], w[1][2] - w[0][2]];
    const e2: V3 = [w[2][0] - w[0][0], w[2][1] - w[0][1], w[2][2] - w[0][2]];
    const n = cross(e1, e2);
    const m = Math.hypot(...n) || 1;
    const dot = Math.abs(
      (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / m,
    );
    return {
      pts,
      shadowPts,
      z: (w[0][2] + w[1][2] + w[2][2]) / 3,
      lit: 0.08 + dot ** 1.4 * 0.92,
    };
  }).sort((a, b) => a.z - b.z);
}

function mix(a: readonly number[], b: readonly number[], t: number) {
  return [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t);
}

function rgb(c: readonly number[]) {
  return `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
}

function hexRgb(hex: string): number[] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = Number.parseInt(full.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* ------------------------------------------------------------------ */
/* Stops along the way                                                  */
/* ------------------------------------------------------------------ */

function StepLabel({
  index,
  text,
  u,
  pal,
}: {
  index: string;
  text?: string;
  u: number;
  pal: Palette;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10 * u,
        fontFamily: sans,
        fontSize: 15 * u,
        fontWeight: 500,
        letterSpacing: "0.01em",
        color: pal.muted,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span>{index}</span>
      <span
        style={{ width: 22 * u, height: Math.max(1, u), background: pal.line }}
      />
      {text && <span style={{ letterSpacing: "-0.005em" }}>{text}</span>}
    </div>
  );
}

function BigWord({ text, u, pal }: { text: string; u: number; pal: Palette }) {
  return (
    <div
      style={{
        fontFamily: display,
        fontWeight: 400,
        fontSize: 140 * u,
        lineHeight: 0.95,
        letterSpacing: "-0.035em",
        fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 0',
        color: pal.stopInk,
        marginTop: 14 * u,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
}

function WriteCard({
  p,
  t,
  u,
  pal,
  accent,
}: {
  p: number;
  t: number;
  u: number;
  pal: Palette;
  accent: string;
}) {
  const widths = [0.86, 0.72, 0.48];
  const lineP = (i: number) =>
    interpolate(p, [i / 3, (i + 1) / 3], [0, 1], { ...CLAMP });
  const active = Math.min(2, Math.floor(p * 3));
  const caretX = widths[active] * lineP(active);
  const blink = p >= 1 ? (Math.floor(t / 15) % 2 === 0 ? 1 : 0.15) : 1;
  return (
    <div
      style={{
        position: "relative",
        width: 300 * u,
        height: 176 * u,
        borderRadius: 14 * u,
        background: pal.card,
        boxShadow: `0 0 0 ${Math.max(1, u)}px ${pal.hair}, 0 ${18 * u}px ${40 * u}px -${18 * u}px ${pal.cardShadow}`,
        padding: 26 * u,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 64 * u,
          height: 8 * u,
          borderRadius: 99,
          background: pal.block,
          marginBottom: 22 * u,
        }}
      />
      {widths.map((w, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            height: 10 * u,
            marginBottom: 14 * u,
          }}
        >
          <div
            style={{
              width: `${w * lineP(i) * 100}%`,
              height: "100%",
              borderRadius: 99,
              background: pal.line,
            }}
          />
          {i === active && (
            <div
              style={{
                position: "absolute",
                left: `calc(${caretX * 100}% + ${4 * u}px)`,
                top: -4 * u,
                width: 2 * u,
                height: 18 * u,
                borderRadius: u,
                background: accent,
                opacity: blink,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function FilmStrip({
  p,
  u,
  pal,
  accent,
}: {
  p: number;
  u: number;
  pal: Palette;
  accent: string;
}) {
  const n = 5;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 * u }}>
      <div style={{ display: "flex", gap: 10 * u }}>
        {Array.from({ length: n }, (_, i) => {
          const done = interpolate(p, [i / n, (i + 0.8) / n], [0, 1], CLAMP);
          return (
            <div
              key={i}
              style={{
                position: "relative",
                width: 78 * u,
                height: 50 * u,
                borderRadius: 8 * u,
                background: pal.card,
                boxShadow: `0 0 0 ${Math.max(1, u)}px ${pal.hair}, 0 ${10 * u}px ${24 * u}px -${12 * u}px ${pal.cardShadow}`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(160deg, ${pal.block}, ${pal.line})`,
                  clipPath: `inset(0 ${(1 - done) * 100}% 0 0)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 9 * u,
                  bottom: 9 * u,
                  width: 26 * u,
                  height: 5 * u,
                  borderRadius: 99,
                  background: i === 2 ? accent : pal.line,
                  opacity: done,
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          height: Math.max(1, 1.5 * u),
          background: pal.hair,
          borderRadius: 99,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            right: `${(1 - p) * 100}%`,
            background: pal.fg,
            opacity: 0.55,
            borderRadius: 99,
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function PaperPlane({
  steps = ["Write", "Render", "Launch"],
  logo,
  url = "remocn.dev",
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
}: PaperPlaneProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const pal = THEMES[theme];
  const W = width;
  const D = width * 0.92;

  // lockup geometry (world space, origin = centre of the first stop)
  const F = 128 * u;
  const dotR = 0.068 * F;
  const lockW = logo ? 4 * F : F * (LOGO_R + 0.04 + LOGO_EMOCN);
  const lockX = 2 * D - (lockW + 0.06 * F + dotR * 2) / 2;
  const lockY = 30 * u;
  const baseY = lockY + 0.36 * F;
  const dotX = lockX + lockW + 0.06 * F + dotR;
  const dotY = baseY - dotR;
  const dot: V2 = { x: dotX, y: dotY };

  const track = useMemo(() => {
    const dot: V2 = { x: dotX, y: dotY };
    // the loop sits above-left of the logo, clear of the letters
    const C = { x: 2 * D - 360 * u, y: lockY - 170 * u };
    const R = 88 * u;
    const loop: V2[] = [];
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI / 2 - (k * Math.PI * 2) / 12;
      loop.push({ x: C.x + Math.cos(a) * R, y: C.y + Math.sin(a) * R });
    }
    return buildTrack([
      { x: -0.66 * W, y: 250 * u },
      { x: -0.32 * W, y: 196 * u },
      { x: 0.02 * W, y: 214 * u },
      { x: 0.32 * W, y: 120 * u },
      { x: 0.6 * W, y: -150 * u },
      { x: D - 0.1 * W, y: -252 * u },
      { x: D + 0.17 * W, y: -180 * u },
      { x: D + 0.36 * W, y: 40 * u },
      { x: C.x - 130 * u, y: C.y + R + 8 * u },
      ...loop,
      // skim over the word, drop past its end and hook back into the full stop
      { x: lockX + lockW * 0.4, y: lockY - 150 * u },
      { x: dot.x + 64 * u, y: lockY - 118 * u },
      { x: dot.x + 90 * u, y: dot.y + 2 * u },
      { x: dot.x + 36 * u, y: dot.y + 22 * u },
      dot,
    ]);
  }, [W, D, u, dotX, dotY, lockX, lockY, lockW]);
  const dist = useMemo(buildDistance, []);

  const sAt = (time: number) => {
    const x = Math.min(LAND, Math.max(0, time)) * 2;
    const i = Math.floor(x);
    const f = x - i;
    const a = dist[Math.min(i, dist.length - 1)];
    const b = dist[Math.min(i + 1, dist.length - 1)];
    return (a + (b - a) * f) * track.total;
  };
  const s = sAt(t);
  const pos = sampleTrack(track, s);
  const heading = headingAt(track, s);

  // bank into the turn, plus a slow rock so the facets keep catching light
  const turn = headingAt(track, s + 30 * u) - headingAt(track, s - 30 * u);
  const wrapped = Math.atan2(Math.sin(turn), Math.cos(turn));
  const bank =
    Math.max(-0.6, Math.min(0.6, wrapped * 0.9)) + Math.sin(t / 13) * 0.22;
  const tilt = 0.95 + Math.sin(t / 21) * 0.08;

  // camera: follows the plane with a soft lag, then settles on the lockup
  let lagX = 0;
  let lagY = 0;
  for (let k = 0; k < 6; k++) {
    const p = sampleTrack(track, sAt(t - 6 - k * 3));
    lagX += p.x / 6;
    lagY += p.y / 6;
  }
  const softMax = (a: number, b: number, k: number) =>
    (a + b + Math.sqrt((a - b) ** 2 + k * k)) / 2;
  const settle = interpolate(t, [LAND - 60, LAND + 6], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const followX = softMax(lagX + 0.08 * W, 0, 180 * u);
  const camX = followX + (2 * D - followX) * settle;
  const camY = lagY * 0.28 * (1 - settle);
  const zoom = 1 + 0.035 * settle;

  // landing: the plane folds itself into the accent dot
  const morph = interpolate(t, [LAND - 14, LAND], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.55, 0, 1, 0.45),
  });
  const planeSize = 62 * u * (1 - morph * 0.86);
  const height3d = interpolate(t, [LAND - 40, LAND], [1, 0], {
    ...CLAMP,
    easing: Easing.bezier(0.55, 0, 1, 0.45),
  });
  const lift = { x: 10 * u * height3d + 2 * u, y: 30 * u * height3d + 3 * u };
  const facets = planeFacets(heading, bank, tilt, planeSize, lift);
  const accentRgb = hexRgb(accent);
  const dotIn = interpolate(t, [LAND - 3, LAND + 4], [0, 1], CLAMP);
  const dotPop = interpolate(t, [LAND, LAND + 6, LAND + 16], [1, 1.12, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  // the dashed trail, oldest part faded
  const trailEnd = Math.max(0, s - planeSize * 0.72);
  const dash = 7 * u;
  const gap = 9 * u;
  const chunks: React.ReactNode[] = [];
  const CH = 140 * u;
  const trailDim = interpolate(t, [LAND - 6, LAND + 30], [1, 0.4], CLAMP);
  for (let c0 = 0; c0 < trailEnd; c0 += CH) {
    const c1 = Math.min(trailEnd, c0 + CH);
    const pts: string[] = [];
    for (let d = c0; d <= c1 + 0.01; d += 6 * u) {
      const p = sampleTrack(track, Math.min(d, c1));
      pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    const behind = trailEnd - c1;
    chunks.push(
      <polyline
        key={c0}
        points={pts.join(" ")}
        fill="none"
        stroke={pal.trail}
        strokeWidth={1.4 * u}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-(c0 % (dash + gap))}
        opacity={interpolate(behind, [0, 1800 * u], [1, 0.3], CLAMP) * trailDim}
      />,
    );
  }

  // stop reactions, driven by where the plane is
  const writeP = interpolate(pos.x, [-0.42 * W, 0.42 * W], [0, 1], CLAMP);
  const renderP = interpolate(
    pos.x,
    [D - 0.3 * W, D + 0.36 * W],
    [0, 1],
    CLAMP,
  );
  const enter = (start: number) =>
    interpolate(t, [start, start + 22], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const s1 = enter(-8);
  const s2 = interpolate(camX, [0.35 * D, 0.75 * D], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const s3 = interpolate(camX, [1.3 * D, 1.75 * D], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const wordReveal = interpolate(camX, [1.5 * D, 1.85 * D], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const urlIn = interpolate(t, [LAND + 8, LAND + 28], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const rise = (p: number) => ({
    opacity: p,
    transform: `translateY(${(1 - p) * 16 * u}px)`,
  });

  const shadowBlur = (2 + height3d * 5) * u;
  const svgId = `pp${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      {pal.texture > 0 && (
        <AbsoluteFill
          style={{
            backgroundImage: PAPER_TEX,
            backgroundSize: `${240 * u}px ${240 * u}px`,
            backgroundPosition: `${-camX * 0.98}px ${-camY}px`,
          }}
        />
      )}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 80% at 40% 30%, ${
            theme === "light"
              ? "rgba(255,255,255,0.6)"
              : "rgba(255,255,255,0.035)"
          }, transparent 100%)`,
        }}
      />

      <AbsoluteFill
        style={{ backgroundImage: groundFill(theme, camX / (2 * D)) }}
      />

      {/* world */}
      <div
        style={{
          position: "absolute",
          left: W / 2,
          top: height / 2,
          width: 0,
          height: 0,
          transform: `scale(${zoom}) translate(${-camX}px, ${-camY}px)`,
        }}
      >
        {/* stop 1: write */}
        <div
          style={{
            position: "absolute",
            left: -0.36 * W,
            top: -150 * u,
            ...rise(s1),
          }}
        >
          <StepLabel index="01" u={u} pal={pal} />
          <BigWord text={steps[0]} u={u} pal={pal} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0.07 * W,
            top: -110 * u,
            transform: `rotate(-3deg) translateY(${(1 - s1) * 20 * u}px)`,
            opacity: s1,
          }}
        >
          <WriteCard p={writeP} t={t} u={u} pal={pal} accent={accent} />
        </div>

        {/* stop 2: render */}
        <div
          style={{
            position: "absolute",
            left: D - 0.3 * W,
            top: -150 * u,
            ...rise(s2),
          }}
        >
          <FilmStrip p={renderP} u={u} pal={pal} accent={accent} />
        </div>
        <div
          style={{
            position: "absolute",
            left: D - 0.3 * W,
            top: -10 * u,
            ...rise(s2),
          }}
        >
          <StepLabel index="02" u={u} pal={pal} />
          <BigWord text={steps[1]} u={u} pal={pal} />
        </div>

        {/* stop 3: launch, the lockup the plane lands in */}
        <div
          style={{
            position: "absolute",
            left: lockX,
            width: lockW,
            display: "flex",
            justifyContent: "flex-end",
            top: baseY - 0.72 * F - 64 * u,
            ...rise(s3),
          }}
        >
          <StepLabel index="03" text={steps[2]} u={u} pal={pal} />
        </div>
        <div
          style={{
            position: "absolute",
            left: lockX,
            top: baseY - LOGO_BASELINE * F,
            height: F,
            display: "flex",
            alignItems: "baseline",
            color: pal.fg,
            fontFamily: sans,
            fontWeight: 600,
            fontSize: F,
            lineHeight: 1,
            letterSpacing: "-0.025em",
          }}
        >
          {logo ?? (
            <>
              <svg
                viewBox="0 0 124.06 134.26"
                style={{
                  height: "0.76em",
                  width: "auto",
                  opacity: s3,
                  transform: `translateY(${(1 - s3) * 16 * u}px)`,
                }}
                aria-hidden
              >
                <path fill="currentColor" d={REMOCN_R_PATH} />
              </svg>
              <span
                style={{
                  marginLeft: "0.04em",
                  clipPath: `inset(-20% ${(1 - wordReveal) * 100}% -20% 0)`,
                  transform: `translateX(${(1 - wordReveal) * -20 * u}px)`,
                }}
              >
                emocn
              </span>
            </>
          )}
        </div>
        <div
          style={{
            position: "absolute",
            left: lockX,
            width: lockW,
            top: baseY + 44 * u,
            textAlign: "center",
            fontFamily: sans,
            fontSize: 21 * u,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            color: pal.muted,
            ...rise(urlIn),
          }}
        >
          {url}
        </div>

        {/* trail + plane */}
        <svg
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            overflow: "visible",
          }}
          width={1}
          height={1}
          aria-hidden
        >
          <defs>
            <filter id={svgId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={shadowBlur} />
            </filter>
          </defs>
          {chunks}
          {morph < 1 && (
            <g transform={`translate(${pos.x} ${pos.y})`}>
              <g filter={`url(#${svgId})`} opacity={1 - morph}>
                {facets.map((fc, i) => (
                  <polygon
                    key={`s${i}`}
                    points={fc.shadowPts}
                    fill={pal.shadow}
                    opacity={0.22 + (1 - height3d) * 0.3}
                  />
                ))}
              </g>
              {facets.map((fc, i) => (
                <polygon
                  key={i}
                  points={fc.pts}
                  fill={rgb(
                    mix(mix(pal.fold, pal.paper, fc.lit), accentRgb, morph),
                  )}
                  stroke={pal.edge}
                  strokeWidth={0.6 * u}
                  strokeLinejoin="round"
                />
              ))}
            </g>
          )}
          {dotIn > 0 && (
            <circle
              cx={dot.x}
              cy={dot.y}
              r={dotR * dotPop}
              fill={accent}
              opacity={dotIn}
            />
          )}
        </svg>
      </div>

      <Grain opacity={pal.grain} />
    </AbsoluteFill>
  );
}
