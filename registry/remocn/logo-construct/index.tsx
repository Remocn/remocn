"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

export interface LogoConstructProps {
  /** Replaces the constructed R. The construction still draws, then your logo settles in its place. */
  logo?: React.ReactNode;
  /** Letters set after the R, on its baseline, in Manrope 600. The real logo reads R + "emocn". */
  name?: string;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  /** Light = blueprint paper (default); dark = drafting film on black. */
  theme?: "light" | "dark";
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_DRAW = Easing.bezier(0.45, 0, 0.2, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "mesh" palette: bg #0a0d24, [#ecdcf2, #8796ee, #2e45b7, #0e1645].
// It fills the constructed R: a mesh of soft blobs inside the letter.
const THEMES = {
  light: {
    bg: "#F5F4F0",
    ink: "#121214",
    guideMix: 0,
    gridAlpha: 0.075,
    majorAlpha: 0.13,
    guideAlpha: 0.62,
    label: 0.9,
    vignette: "rgba(120,110,90,0.10)",
    grain: 0.05,
    meshBase: "#0a0d24",
    // [colour, x, y, radius, opacity] per blob, in the R's bounding box
    mesh: [
      ["#ecdcf2", 0.58, 0.1, 0.42, 0.55],
      ["#8796ee", 0.95, 0.32, 0.7, 1],
      ["#2e45b7", 0.74, 0.92, 0.7, 1],
      ["#0e1645", 0.12, 0.72, 0.7, 1],
    ],
  },
  dark: {
    bg: "#0A0A0B",
    ink: "#F3F2EF",
    guideMix: 0.45,
    gridAlpha: 0.07,
    majorAlpha: 0.12,
    guideAlpha: 0.7,
    label: 0.95,
    vignette: "rgba(0,0,0,0.55)",
    grain: 0.06,
    meshBase: "#2e45b7",
    mesh: [
      ["#ecdcf2", 0.6, 0.12, 0.5, 0.9],
      ["#8796ee", 0.12, 0.22, 0.7, 1],
      ["#2e45b7", 0.74, 0.9, 0.7, 1],
      ["#8796ee", 0.2, 0.86, 0.5, 0.8],
    ],
  },
} as const;

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

// Construction geometry, measured off the R path (R units, y down, 134.26 tall).
const R_W = 121.44;
const H = 134.26;
/** One stroke module: the bar, stem, mid bar and bowl are all ~1/7 of the height. */
const M = H / 7;
/** Bowl: concentric arcs around one centre. */
const BOWL = { x: 79.6, y: 42.6, ro: 41.9, ri: 23.1 };
const BAR_IN = 19.3;
const MID_TOP = 67.7;
const MID_BOT = 87.6;
const STEM_R = 19;
/** Leg: the outer edge runs from (84.4, 91.6) to the foot at (117, 134.2). */
const LEG = { x0: 84.4, y0: 91.6, x1: 117, y1: 134.2 };
const LEG_DEG = (Math.atan2(LEG.y1 - LEG.y0, LEG.x1 - LEG.x0) * 180) / Math.PI;
/** Bezier anchors + handles of the two transitions that give the R its voice. */
const HANDLES = [
  // the top-left swash
  { a: [21.7, 18.9], h: [13.45, 17.16] },
  { a: [1.09, 4.13], h: [4.91, 11.04] },
  // the mid bar turning down into the stem
  { a: [10.65, 79.89], h: [14.84, 75.7] },
  { a: [10.65, 79.89], h: [4.86, 85.68] },
  { a: [19.82, 101.04], h: [21.79, 93.65] },
  { a: [36.45, 87.63], h: [27.86, 88.75] },
] as const;

// The wordmark, set like the site header: R is 0.76em tall, "emocn" Manrope 600 at -0.025em.
const FONT = H / 0.76;
const X_HEIGHT = 0.54;
const WORD_XLINE = H - FONT * X_HEIGHT;
const TRACK = -0.025;
/** Manrope 600 advances, per em. */
const ADV: Record<string, number> = {
  a: 0.57,
  c: 0.568,
  e: 0.596,
  i: 0.264,
  l: 0.264,
  m: 0.882,
  n: 0.615,
  o: 0.61,
  r: 0.386,
  s: 0.536,
  t: 0.422,
  " ": 0.26,
};
const WORD_X = 124.06 + FONT * 0.04;
const RISE = FONT * 0.8;

function hexRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = Number.parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function tint(hex: string, mixWhite: number, alpha: number) {
  const [r, g, b] = hexRgb(hex).map((c) =>
    Math.round(c + (255 - c) * mixWhite),
  );
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Polyline of a circular arc, angles in degrees, y down (270 = up). */
function arc(cx: number, cy: number, r: number, a0: number, sweep: number) {
  const steps = Math.max(2, Math.ceil(Math.abs(sweep) / 3));
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const a = ((a0 + (sweep * i) / steps) * Math.PI) / 180;
    d += `${i ? "L" : "M"}${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}`;
  }
  return d;
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
          baseFrequency="0.85"
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

export function LogoConstruct({
  logo,
  name = "emocn",
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
}: LogoConstructProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const pal = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const p = (a: number, b: number, easing = EASE_DRAW) =>
    interpolate(t, [a, b], [0, 1], { ...CLAMP, easing });

  // ---- camera: tight on the R, then an eased pull back to the lockup ----
  const wordW =
    name.split("").reduce((w, ch) => w + (ADV[ch] ?? 0.6) + TRACK, 0) * FONT;
  const lockL = 0;
  const lockR = WORD_X + wordW;
  const dimRoom = 30;
  const s1 = 3.05 * u;
  const s2 = Math.min((width * 0.6) / (lockR + dimRoom - lockL), 1.25 * u);
  const pull = p(120, 168, EASE_IO);
  const drift = interpolate(t, [0, 120], [0, 1], CLAMP);
  const sCam = Math.exp(
    interpolate(
      pull,
      [0, 1],
      [Math.log(s1 * (0.965 + drift * 0.035)), Math.log(s2)],
    ),
  );
  const camX = interpolate(pull, [0, 1], [R_W / 2 + 4, (lockL + lockR) / 2]);
  const camY = interpolate(pull, [0, 1], [H / 2 - 2, H / 2 + 4]);
  const hold = interpolate(t, [160, 260], [1, 1.03], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const s = sCam * hold;
  const tx = width / 2 - camX * s;
  const ty = height / 2 - camY * s;
  const px = (n: number) => n / s; // screen px -> units at the current zoom

  // visible range in units, for grid + infinite guides
  const vx0 = (0 - tx) / s;
  const vx1 = (width - tx) / s;
  const vy0 = (0 - ty) / s;
  const vy1 = (height - ty) / s;

  // ---- colours ----
  const guide = tint(accent, pal.guideMix, 1);
  const guideA = (a: number) => tint(accent, pal.guideMix, a);

  // guides settle to hairlines once the mark is solid
  const settle = p(112, 150, EASE_IO);
  const guideLevel = interpolate(settle, [0, 1], [pal.guideAlpha, 0.2]);
  const labelLevel = interpolate(p(110, 132, EASE_IO), [0, 1], [pal.label, 0]);

  // ---- paper grid on the module (half-module minor, module major) ----
  const gridIn = 0.45 + 0.55 * p(0, 18, EASE_OUT);
  const minorStep = M / 2;
  const minorAlpha =
    pal.gridAlpha *
    gridIn *
    interpolate(minorStep * s, [10 * u, 26 * u], [0.25, 1], CLAMP);
  const gridLines: React.ReactNode[] = [];
  for (let i = Math.floor(vx0 / minorStep); i * minorStep <= vx1; i++) {
    const gx = i * minorStep;
    const major = i % 2 === 0;
    gridLines.push(
      <line
        key={`gx${i}`}
        x1={gx}
        x2={gx}
        y1={vy0}
        y2={vy1}
        stroke={guideA(major ? pal.majorAlpha * gridIn : minorAlpha)}
        strokeWidth={px(1)}
      />,
    );
  }
  for (let i = Math.floor(vy0 / minorStep); i * minorStep <= vy1; i++) {
    const gy = i * minorStep;
    const major = i % 2 === 0;
    gridLines.push(
      <line
        key={`gy${i}`}
        y1={gy}
        y2={gy}
        x1={vx0}
        x2={vx1}
        stroke={guideA(major ? pal.majorAlpha * gridIn : minorAlpha)}
        strokeWidth={px(1)}
      />,
    );
  }

  // ---- infinite guides that grow out from the R ----
  const span = Math.max(vx1 - vx0, vy1 - vy0) * 1.2;
  const hGuides = [
    { y: 0, from: 60, at: 8 },
    { y: H, from: 60, at: 11 },
    { y: BOWL.y, from: BOWL.x, at: 16 },
    { y: BAR_IN, from: 50, at: 19 },
    { y: MID_TOP, from: 50, at: 22 },
    { y: MID_BOT, from: 50, at: 25 },
  ];
  const vGuides = [
    { x: 0, from: 67, at: 13 },
    { x: STEM_R, from: 67, at: 17 },
    { x: BOWL.x, from: BOWL.y, at: 21 },
    { x: R_W, from: BOWL.y, at: 24 },
  ];
  // the wordmark re-lights the baseline
  const relight = p(146, 166, EASE_OUT) * (1 - p(196, 230, EASE_IO) * 0.5);
  const lineAlpha = (y?: number) =>
    y === H ? guideLevel + relight * (pal.guideAlpha - 0.2) * 0.9 : guideLevel;

  // ---- construction draw windows ----
  const crossIn = p(28, 40, EASE_OUT);
  const radius = p(32, 46);
  const outer = p(36, 66);
  const inner = p(48, 64);
  const dims = p(44, 60, EASE_OUT);
  const ruler = p(40, 64);
  const leg = p(54, 72);
  const legArc = p(60, 76);
  const handles = HANDLES.map((_, i) => p(58 + i * 3, 70 + i * 3, EASE_OUT));
  const outline = p(72, 106);
  const fill = p(96, 128, EASE_IO);
  const markDone = p(122, 134, EASE_OUT);

  const hair = px(1 * u);
  const thin = px(1.25 * u);
  const dash = `${px(3 * u)} ${px(3.5 * u)}`;
  const fs = px(12 * u);

  const Label = ({
    x,
    y,
    children,
    anchor = "start",
    o = 1,
    rotate,
  }: {
    x: number;
    y: number;
    children: React.ReactNode;
    anchor?: "start" | "middle" | "end";
    o?: number;
    rotate?: number;
  }) => (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily={mono}
      fontSize={fs}
      fontWeight={500}
      letterSpacing={px(0.2 * u)}
      fill={guide}
      opacity={o * labelLevel}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {children}
    </text>
  );

  const tick = (x: number, y: number, vertical: boolean, len = 3) =>
    vertical ? (
      <line x1={x} x2={x} y1={y - len} y2={y + len} />
    ) : (
      <line x1={x - len} x2={x + len} y1={y} y2={y} />
    );

  // the fill sweeps round the bowl centre, like the compass did
  const wedge = (() => {
    const sweep = 360 * fill;
    if (sweep <= 0) return "M0 0z";
    if (sweep >= 359.9) return `M-400 -400H600V600H-400z`;
    return `M${BOWL.x} ${BOWL.y}${arc(BOWL.x, BOWL.y, 400, 180, sweep).replace("M", "L")}Z`;
  })();

  // mesh blobs drift a few percent over the shot
  const blob = (bx: number, by: number, k: number) => ({
    cx: R_W * (bx + Math.sin(t / 47 + k * 1.7) * 0.04),
    cy: H * (by + Math.cos(t / 53 + k * 2.3) * 0.03),
  });
  const blobs = pal.mesh.map(([c, bx, by, r, o], k) => ({
    ...blob(bx, by, k),
    c,
    r: R_W * r,
    o,
  }));

  // wordmark letters rise out of the baseline, 3 frames apart
  const letters = name.split("");
  const letterP = (i: number) => p(144 + i * 3, 164 + i * 3, EASE_OUT);
  const wordGuides = p(140, 160, EASE_OUT);
  const xGrow = p(138, 166);
  const wordSettle = p(198, 232, EASE_IO);
  const dimX = lockR + 14;

  // logo overlay geometry (screen)
  const markScreen = {
    left: tx,
    top: ty,
    size: H * s,
  };
  const logoIn = p(100, 126, EASE_OUT);

  const legLen = Math.hypot(LEG.x1 - LEG.x0, LEG.y1 - LEG.y0);
  const legUx = (LEG.x1 - LEG.x0) / legLen;
  const legUy = (LEG.y1 - LEG.y0) / legLen;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <clipPath id={`fill${uid}`} clipPathUnits="userSpaceOnUse">
            <path d={wedge} />
          </clipPath>
          {blobs.map((b, i) => (
            <radialGradient
              key={i}
              id={`mesh${uid}${i}`}
              gradientUnits="userSpaceOnUse"
              cx={b.cx}
              cy={b.cy}
              r={b.r}
            >
              <stop offset="0%" stopColor={b.c} stopOpacity={b.o} />
              <stop offset="68%" stopColor={b.c} stopOpacity={0} />
            </radialGradient>
          ))}
          <clipPath id={`word${uid}`} clipPathUnits="userSpaceOnUse">
            <rect
              x={WORD_X - 10}
              y={-200}
              width={wordW + 60}
              height={H + 200.5}
            />
          </clipPath>
        </defs>
        <g transform={`translate(${tx} ${ty}) scale(${s})`}>
          {gridLines}

          {/* infinite construction guides */}
          <g stroke={guide} strokeWidth={hair} fill="none">
            {hGuides.map((g) => {
              const k = p(g.at, g.at + 26);
              return (
                <line
                  key={`h${g.y}`}
                  x1={g.from - span * k}
                  x2={g.from + span * k}
                  y1={g.y}
                  y2={g.y}
                  opacity={lineAlpha(g.y)}
                />
              );
            })}
            {vGuides.map((g) => {
              const k = p(g.at, g.at + 26);
              return (
                <line
                  key={`v${g.x}`}
                  y1={g.from - span * k}
                  y2={g.from + span * k}
                  x1={g.x}
                  x2={g.x}
                  opacity={guideLevel}
                />
              );
            })}
          </g>

          {/* compass, ruler and handle work */}
          <g
            stroke={guide}
            fill="none"
            strokeWidth={thin}
            opacity={interpolate(settle, [0, 1], [1, 0.3])}
          >
            <g opacity={crossIn}>
              <line x1={BOWL.x - 5} x2={BOWL.x + 5} y1={BOWL.y} y2={BOWL.y} />
              <line y1={BOWL.y - 5} y2={BOWL.y + 5} x1={BOWL.x} x2={BOWL.x} />
              <circle cx={BOWL.x} cy={BOWL.y} r={1.4} />
            </g>
            {radius > 0 && (
              <line
                x1={BOWL.x}
                y1={BOWL.y}
                x2={BOWL.x + Math.cos(-Math.PI / 4) * BOWL.ro * radius}
                y2={BOWL.y + Math.sin(-Math.PI / 4) * BOWL.ro * radius}
              />
            )}
            {outer > 0 && (
              <path
                d={arc(BOWL.x, BOWL.y, BOWL.ro, 180, 360 * outer)}
                strokeDasharray={dash}
              />
            )}
            {inner > 0 && (
              <path
                d={arc(BOWL.x, BOWL.y, BOWL.ri, 180, 360 * inner)}
                strokeDasharray={dash}
              />
            )}
            {/* 90° quadrant marker */}
            <path
              d={arc(BOWL.x, BOWL.y, 9, 270, 90 * p(46, 60))}
              opacity={0.8}
            />

            {/* leg: its axis, extended, and the angle off the baseline */}
            {leg > 0 && (
              <line
                x1={LEG.x0 - legUx * 26}
                y1={LEG.y0 - legUy * 26}
                x2={LEG.x0 - legUx * 26 + legUx * (legLen + 46) * leg}
                y2={LEG.y0 - legUy * 26 + legUy * (legLen + 46) * leg}
                strokeDasharray={dash}
              />
            )}
            {legArc > 0 && (
              <path
                d={arc(LEG.x1, LEG.y1, 16, 180, LEG_DEG * legArc)}
                transform={`translate(0 0)`}
              />
            )}

            {/* bezier handles of the swash and the stem join */}
            {HANDLES.map((hd, i) =>
              handles[i] > 0 ? (
                <g key={`hd${i}`} opacity={handles[i]}>
                  <line
                    x1={hd.a[0]}
                    y1={hd.a[1]}
                    x2={hd.a[0] + (hd.h[0] - hd.a[0]) * handles[i]}
                    y2={hd.a[1] + (hd.h[1] - hd.a[1]) * handles[i]}
                  />
                  <circle
                    cx={hd.a[0] + (hd.h[0] - hd.a[0]) * handles[i]}
                    cy={hd.a[1] + (hd.h[1] - hd.a[1]) * handles[i]}
                    r={px(3 * u)}
                    fill={pal.bg}
                  />
                  <rect
                    x={hd.a[0] - px(3.5 * u)}
                    y={hd.a[1] - px(3.5 * u)}
                    width={px(7 * u)}
                    height={px(7 * u)}
                    fill={pal.bg}
                  />
                </g>
              ) : null,
            )}

            {/* module ruler: seven strokes tall */}
            <g opacity={dims}>
              <line x1={-14} x2={-14} y1={0} y2={H * ruler} />
              {Array.from({ length: 8 }, (_, i) =>
                i * M <= H * ruler + 0.01 ? (
                  <g key={`m${i}`}>
                    {tick(-14, i * M, false, i % 7 === 0 ? 4 : 2.4)}
                  </g>
                ) : null,
              )}
              {/* width */}
              <line x1={0} x2={R_W * ruler} y1={-14} y2={-14} />
              {tick(0, -14, true, 4)}
              {ruler >= 1 && tick(R_W, -14, true, 4)}
              {/* bar thickness */}
              <line x1={56} x2={56} y1={0} y2={BAR_IN} />
              {tick(56, 0, false, 2.4)}
              {tick(56, BAR_IN, false, 2.4)}
            </g>
          </g>

          {/* measurement labels */}
          <g opacity={dims}>
            <Label x={R_W / 2} y={-14 - px(8 * u)} anchor="middle">
              124
            </Label>
            <Label x={-14 - px(10 * u)} y={H / 2} anchor="middle" rotate={-90}>
              7m · 134
            </Label>
            <Label x={56 + px(8 * u)} y={BAR_IN / 2 + px(4 * u)}>
              m 19.2
            </Label>
          </g>
          <Label
            x={BOWL.x + Math.cos(-Math.PI / 4) * BOWL.ro + px(6 * u)}
            y={BOWL.y + Math.sin(-Math.PI / 4) * BOWL.ro - px(4 * u)}
            o={radius}
          >
            R42
          </Label>
          <Label
            x={BOWL.x - BOWL.ri - px(8 * u)}
            y={BOWL.y - px(8 * u)}
            anchor="end"
            o={inner}
          >
            R23
          </Label>
          <Label x={BOWL.x + px(8 * u)} y={BOWL.y + px(18 * u)} o={crossIn}>
            80,43
          </Label>
          <Label x={LEG.x1 - 20} y={LEG.y1 - 6} anchor="end" o={legArc}>
            {`${LEG_DEG.toFixed(0)}°`}
          </Label>

          {/* the R: outline first, then the mesh fill sweeps round the bowl centre */}
          {!logo && (
            <g>
              {outline > 0 && (
                <path
                  d={REMOCN_R_PATH}
                  fill="none"
                  stroke={pal.ink}
                  strokeWidth={px(1.4 * u)}
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={`${outline} 2`}
                  opacity={1 - markDone}
                />
              )}
              <g clipPath={`url(#fill${uid})`}>
                <path d={REMOCN_R_PATH} fill={pal.meshBase} />
                {blobs.map((_, i) => (
                  <path
                    key={i}
                    d={REMOCN_R_PATH}
                    fill={`url(#mesh${uid}${i})`}
                  />
                ))}
              </g>
            </g>
          )}

          {/* wordmark guides: its x-height, the shared baseline, a side bearing */}
          <g stroke={guide} strokeWidth={hair} fill="none">
            <line
              x1={WORD_X - span * xGrow}
              x2={WORD_X + span * xGrow}
              y1={WORD_XLINE}
              y2={WORD_XLINE}
              opacity={pal.guideAlpha * 0.85 * (1 - wordSettle * 0.7)}
            />
          </g>
          <g
            opacity={wordGuides * (1 - wordSettle * 0.75)}
            stroke={guide}
            strokeWidth={thin}
            fill="none"
          >
            <line
              x1={WORD_X - 3}
              x2={WORD_X - 3}
              y1={WORD_XLINE - 10}
              y2={H + 10}
              strokeDasharray={dash}
            />
          </g>
          <g
            opacity={p(156, 174, EASE_OUT) * (1 - wordSettle * 0.75)}
            stroke={guide}
            strokeWidth={thin}
          >
            <line x1={dimX} x2={dimX} y1={WORD_XLINE} y2={H} />
            {tick(dimX, WORD_XLINE, false, 4)}
            {tick(dimX, H, false, 4)}
          </g>
          <g
            opacity={p(156, 174, EASE_OUT) * (1 - wordSettle * 0.75)}
            fontFamily={mono}
            fontSize={fs}
            fontWeight={500}
            fill={guide}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            <text x={dimX + px(8 * u)} y={(WORD_XLINE + H) / 2 + px(4 * u)}>
              0.54em
            </text>
            <text x={WORD_X} y={WORD_XLINE - px(7 * u)}>
              x-height
            </text>
            <text x={WORD_X} y={H + px(17 * u)}>
              baseline
            </text>
          </g>
          <g clipPath={`url(#word${uid})`}>
            <text
              x={WORD_X}
              y={H}
              fontFamily={manrope.fontFamily}
              fontWeight={600}
              fontSize={FONT}
              letterSpacing={FONT * TRACK}
              fill={pal.ink}
            >
              {letters.map((ch, i) => {
                const k = letterP(i);
                const prev = i === 0 ? 0 : (1 - letterP(i - 1)) * RISE;
                return (
                  <tspan
                    key={i}
                    dy={(1 - k) * RISE - prev}
                    fillOpacity={0.15 + k * 0.85}
                  >
                    {ch}
                  </tspan>
                );
              })}
            </text>
          </g>
        </g>
      </svg>

      {logo && (
        <div
          style={{
            position: "absolute",
            left: markScreen.left,
            top: markScreen.top,
            height: markScreen.size,
            display: "flex",
            alignItems: "center",
            opacity: logoIn,
            filter: `blur(${(1 - logoIn) * 6 * u}px)`,
            transform: `scale(${0.96 + logoIn * 0.04})`,
            transformOrigin: "left center",
          }}
        >
          {logo}
        </div>
      )}

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 70% at 50% 48%, transparent 55%, ${pal.vignette} 100%)`,
        }}
      />
      <Grain opacity={pal.grain} />
    </AbsoluteFill>
  );
}
