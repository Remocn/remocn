"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["300", "400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

/**
 * Beat sheet (30fps, speed 1):
 * 0–22     lanes arrive: labels settle, hairline tracks draw left to right.
 * 22       start: every lane runs on one shared clock, each on its own curve.
 * 64       the product lane hits the finish line; its time freezes, a ring
 *          pulses off the head. The other lanes dim and keep crawling.
 * 62–104   the camera glides the lanes down; the multiplier statement rolls
 *          in above them, digits odometer into place.
 * 104–150  hold. The slow clocks are still ticking.
 */

export interface BenchmarkLane {
  label: string;
  /** Finish time in `unit`s. */
  seconds: number;
  /** The product lane. Defaults to the fastest lane. */
  highlight?: boolean;
}

export interface BenchmarkRaceProps {
  lanes?: BenchmarkLane[];
  /** Suffix on the clocks. */
  unit?: string;
  /** Lands above the lanes after the hit. A leading number rolls in. */
  statement?: string;
  /** Small caption over the lanes: what was measured. */
  title?: string;
  /** Digits after the decimal point on the clocks. */
  decimals?: number;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_LANES: BenchmarkLane[] = [
  { label: "remocn", seconds: 0.42, highlight: true },
  { label: "Kitebase", seconds: 2.38 },
  { label: "Before", seconds: 5.06 },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const START = 22;
const WIN_FRAMES = 42;
const HIT = START + WIN_FRAMES;

/**
 * gradients.sh "mesh" palette: [#ecdcf2, #8796ee, #2e45b7, #0e1645]. It runs
 * through the product lane, lights the multiplier and, on dark, rises as a
 * haze behind the statement once the race is won.
 */
const MESH = ["#ecdcf2", "#8796ee", "#2e45b7", "#0e1645"] as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    stage: "rgba(255,255,255,0.06)",
    /** Product lane, start → head. */
    run: [MESH[3], MESH[2], MESH[1], MESH[0]],
    head: MESH[0],
    /** Multiplier fill, top → bottom. */
    lead: [MESH[0], MESH[1], MESH[2]],
    haze: 0.5,
    fg: "#F3F2EF",
    muted: "#8B8A90",
    faint: "#5A595F",
    track: "rgba(255,255,255,0.12)",
    slow: "#C9C8CC",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    stage: "rgba(255,255,255,0.85)",
    run: [MESH[1], MESH[1], MESH[2], MESH[3]],
    head: MESH[3],
    lead: [MESH[3], MESH[2], MESH[1]],
    haze: 0,
    fg: "#121214",
    muted: "#6E6C67",
    faint: "#A3A099",
    track: "rgba(18,18,20,0.12)",
    slow: "#3A3936",
    grain: 0.04,
  },
} as const;

type Theme = (typeof THEMES)[keyof typeof THEMES];

/**
 * The remocn.dev logo as outlines: the R mark (0.76em, on the baseline) and
 * "emocn" in Manrope 600 at -0.025em, 100 units per em, baseline at y = 0.
 * Glyph contours overlap (m, n, the e's bar), so they fill nonzero.
 */
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
/** Ink box of the outlined logo, in its own units; the R is `rW` wide. */
const LOGO = { x: 0, y: -76, w: 383.2, h: 77.5, rW: 70.23 } as const;

/** The whole logo in one fill (a colour or a `url(#gradient)`). */
function LogoPaths({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <path d={LOGO_R} />
      {LOGO_EMOCN.map((d) => (
        <path key={d.slice(0, 16)} d={d} />
      ))}
    </g>
  );
}

/** The logo set like a lane label: `size` is the font size it stands in for. */
function LogoLabel({ size, color }: { size: number; color: string }) {
  const k = size / 100;
  return (
    <svg
      width={LOGO.w * k}
      height={LOGO.h * k}
      viewBox={`${LOGO.x} ${LOGO.y} ${LOGO.w} ${LOGO.h}`}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      <LogoPaths fill={color} />
    </svg>
  );
}

/** The mesh recipe, held to the top of the frame behind the statement. */
function meshHaze(drift: number) {
  const blobs: [string, number, number][] = [
    [MESH[2], 16 + 4 * drift, 18],
    [MESH[3], 84 - 3 * drift, 22],
    [MESH[1], 30 + 6 * drift, -6],
    [MESH[3], 58, 30],
  ];
  return blobs
    .map(
      ([c, x, y]) =>
        `radial-gradient(70% 62% at ${x}% ${y}%, color-mix(in oklab, ${c} 70%, transparent) 0%, transparent 68%)`,
    )
    .join(", ");
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
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

/**
 * Each lane gets its own curve. The product lane accelerates hard and brakes
 * late, so it arrives with intent; slower lanes hitch along with small stalls.
 */
function laneCurve(s: number, winner: boolean, index: number) {
  if (s <= 0) return 0;
  if (s >= 1) return 1;
  if (winner) return Easing.bezier(0.6, 0, 0.18, 1)(s);
  const k = 3 + (index % 3);
  const a = 0.55 + (index % 2) * 0.2;
  const base = Easing.bezier(0.35, 0, 0.65, 1)(s);
  return base - (a * Math.sin(2 * Math.PI * k * s)) / (2 * Math.PI * k) / 4;
}

/**
 * The statement lands glyph by glyph: the figure first, each character rising
 * out of a soft window, then the rest of the line as one piece.
 */
function LandingStatement({
  text,
  t,
  fontSize,
  lead: fill,
  muted,
}: {
  text: string;
  t: number;
  fontSize: number;
  /** Top → bottom stops painted through the figure. */
  lead: readonly string[];
  muted: string;
}) {
  const match = text.match(/^(\d[\d.,]*\s*[×x]?)(.*)$/);
  const lead = match ? match[1] : "";
  const rest = match ? match[2] : text;
  const chars = Array.from(lead);
  const rise = (delay: number) =>
    interpolate(t, [delay, delay + 22], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const restP = rise(chars.length * 3 + 2);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        whiteSpace: "pre",
        fontFamily: sans,
        fontWeight: 400,
        fontSize,
        lineHeight: 1.1,
        letterSpacing: "-0.05em",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {chars.map((ch, i) => {
        const p = rise(i * 3);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              overflow: "hidden",
              paddingBottom: fontSize * 0.04,
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: `translateY(${(1 - p) * 0.62 * fontSize}px)`,
                opacity: interpolate(p, [0, 0.5], [0, 1], CLAMP),
                backgroundImage: `linear-gradient(180deg, ${fill[0]} 18%, ${fill[1]} 58%, ${fill[2]} 92%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {ch}
            </span>
          </span>
        );
      })}
      <span
        style={{
          color: muted,
          fontWeight: 300,
          letterSpacing: "-0.04em",
          display: "inline-block",
          opacity: restP,
          transform: `translateY(${(1 - restP) * 0.18 * fontSize}px)`,
        }}
      >
        {rest}
      </span>
    </div>
  );
}

function Lane({
  lane,
  index,
  winner,
  t,
  u,
  x0,
  trackW,
  valueW,
  rowH,
  secPerFrame,
  decimals,
  unit,
  accent,
  th,
}: {
  lane: BenchmarkLane;
  index: number;
  winner: boolean;
  t: number;
  u: number;
  x0: number;
  trackW: number;
  valueW: number;
  rowH: number;
  secPerFrame: number;
  decimals: number;
  unit: string;
  accent: string;
  th: Theme;
}) {
  const gid = `run${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const enter = interpolate(t, [index * 4, index * 4 + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const draw = interpolate(t, [4 + index * 4, 26 + index * 4], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const dur = lane.seconds / secPerFrame;
  const progAt = (frame: number) =>
    laneCurve((frame - START) / dur, winner, index);
  const p = progAt(t);
  const running = t >= START;
  const finished = t - START >= dur;
  const elapsed = Math.min(lane.seconds, Math.max(0, t - START) * secPerFrame);

  // losers dim once the winner lands, but keep moving
  const dim = winner
    ? 1
    : interpolate(t, [HIT - 2, HIT + 16], [1, 0.42], {
        ...CLAMP,
        easing: EASE_OUT,
      });
  const color = winner ? `url(#${gid})` : th.slow;
  const headFill = winner ? th.head : th.slow;
  const headX = x0 + p * trackW;
  const cy = rowH / 2;

  // the hit
  const hitP = winner
    ? interpolate(t, [HIT, HIT + 20], [0, 1], { ...CLAMP, easing: EASE_OUT })
    : 0;
  const pulse = winner
    ? interpolate(t, [HIT, HIT + 5, HIT + 16], [1, 1.12, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      })
    : 1;

  // fake motion blur: ghost heads at the previous few frames
  const ghosts = [1, 2, 3].map((g) => x0 + progAt(t - g * 0.8) * trackW);

  const headR = (winner ? 6.5 : 4.5) * u;
  const lineH = (winner ? 4 : 2) * u;
  const isLogo = winner && lane.label.trim().toLowerCase() === "remocn";

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: index * rowH,
        height: rowH,
        opacity: enter * dim,
        transform: `translateY(${(1 - enter) * 12 * u}px)`,
      }}
    >
      {/* label */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: cy - 14 * u,
          height: 28 * u,
          display: "flex",
          alignItems: "center",
          gap: 10 * u,
          fontFamily: sans,
          fontSize: 23 * u,
          fontWeight: winner ? 500 : 400,
          letterSpacing: "-0.025em",
          color: winner ? th.fg : th.muted,
        }}
      >
        {isLogo ? <LogoLabel size={25 * u} color={th.fg} /> : lane.label}
      </div>

      <svg
        width="100%"
        height={rowH}
        style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        aria-hidden
      >
        {winner ? (
          <defs>
            <linearGradient
              id={gid}
              gradientUnits="userSpaceOnUse"
              x1={x0}
              x2={x0 + trackW}
              y1={0}
              y2={0}
            >
              <stop offset="0%" stopColor={th.run[0]} />
              <stop offset="40%" stopColor={th.run[1]} />
              <stop offset="78%" stopColor={th.run[2]} />
              <stop offset="100%" stopColor={th.run[3]} />
            </linearGradient>
          </defs>
        ) : null}
        {/* track */}
        <line
          x1={x0}
          x2={x0 + trackW * draw}
          y1={cy}
          y2={cy}
          stroke={th.track}
          strokeWidth={Math.max(1, u)}
        />
        {/* finish tick */}
        <line
          x1={x0 + trackW}
          x2={x0 + trackW}
          y1={cy - 11 * u}
          y2={cy + 11 * u}
          stroke={winner && t >= HIT ? accent : th.track}
          strokeWidth={Math.max(1, 1.5 * u)}
          opacity={draw}
        />
        {running && (
          <>
            {winner ? (
              <line
                x1={x0}
                x2={headX}
                y1={cy}
                y2={cy}
                stroke={color}
                strokeWidth={14 * u}
                strokeLinecap="round"
                opacity={0.16}
              />
            ) : null}
            <line
              x1={x0}
              x2={headX}
              y1={cy}
              y2={cy}
              stroke={color}
              strokeWidth={lineH}
              strokeLinecap="round"
            />
            {!finished &&
              ghosts.map((gx, g) => (
                <circle
                  key={g}
                  cx={gx}
                  cy={cy}
                  r={headR}
                  fill={headFill}
                  opacity={0.22 - g * 0.06}
                />
              ))}
            {winner && t >= HIT && (
              <circle
                cx={headX}
                cy={cy}
                r={headR + hitP * 26 * u}
                fill="none"
                stroke={accent}
                strokeWidth={1.5 * u}
                opacity={(1 - hitP) * 0.7}
              />
            )}
            <circle
              cx={headX}
              cy={cy}
              r={headR * pulse}
              fill={headFill}
              stroke={th.bg}
              strokeWidth={2 * u}
            />
          </>
        )}
      </svg>

      {/* clock */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: cy - 16 * u,
          width: valueW,
          height: 32 * u,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          fontFamily: mono,
          fontSize: (winner ? 28 : 24) * u,
          fontWeight: winner ? 500 : 400,
          letterSpacing: "-0.04em",
          fontVariantNumeric: "tabular-nums",
          color: winner ? (finished ? accent : th.fg) : th.muted,
          transform: `scale(${pulse})`,
          transformOrigin: "100% 50%",
          opacity: interpolate(t, [START - 8, START], [0.35, 1], CLAMP),
        }}
      >
        {elapsed.toFixed(decimals)}
        <span style={{ color: th.muted, marginLeft: u, fontWeight: 400 }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

export function BenchmarkRace({
  lanes = DEFAULT_LANES,
  unit = "s",
  statement = "12× faster",
  title = "Cold render, 1080p · median of 50 runs",
  decimals = 2,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: BenchmarkRaceProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const th: Theme = THEMES[theme];

  const hasHighlight = lanes.some((l) => l.highlight);
  const fastest = lanes.reduce(
    (best, l, i) => (l.seconds < lanes[best].seconds ? i : best),
    0,
  );
  const winnerIndex = hasHighlight
    ? lanes.findIndex((l) => l.highlight)
    : fastest;
  const secPerFrame = lanes[winnerIndex].seconds / WIN_FRAMES;

  const marginX = Math.round(width * 0.094);
  const labelW = 190 * u;
  const valueW = 150 * u;
  const trackW = width - marginX * 2 - labelW - valueW - 24 * u;
  const rowH = 76 * u;
  const headerH = 48 * u;
  const groupH = headerH + lanes.length * rowH;

  // camera: lanes start centered, glide down to make room for the statement
  const glide = interpolate(t, [HIT - 4, HIT + 38], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const topStart = (height - groupH) / 2;
  const topEnd = height - 104 * u - groupH;
  const groupTop = topStart + (topEnd - topStart) * glide;
  const groupScale = 1.04 - 0.04 * glide;

  const st = t - (HIT + 2);
  const stP = interpolate(st, [0, 28], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const statementSize = Math.min(150 * u, width * 0.118);

  const headerP = interpolate(t, [0, 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  return (
    <AbsoluteFill style={{ background: th.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 65% at 35% 30%, ${th.stage}, transparent 75%)`,
        }}
      />
      {th.haze > 0 ? (
        <AbsoluteFill
          style={{
            background: meshHaze(glide),
            opacity: th.haze * stP,
            maskImage:
              "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.6) 38%, transparent 70%)",
          }}
        />
      ) : null}

      {/* statement */}
      <div
        style={{
          position: "absolute",
          left: marginX - statementSize * 0.04,
          top: groupTop - statementSize - 70 * u,
          opacity: stP,
          transform: `translateY(${(1 - stP) * 14 * u}px)`,
          filter: stP < 0.98 ? `blur(${(1 - stP) * 6 * u}px)` : undefined,
        }}
      >
        <LandingStatement
          text={statement}
          t={st}
          fontSize={statementSize}
          lead={th.lead}
          muted={th.muted}
        />
      </div>

      {/* lanes */}
      <div
        style={{
          position: "absolute",
          left: marginX,
          right: marginX,
          top: groupTop,
          height: groupH,
          transform: `scale(${groupScale})`,
          transformOrigin: "0% 50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: headerH,
            display: "flex",
            justifyContent: "space-between",
            fontFamily: mono,
            fontSize: 14 * u,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            color: th.muted,
            opacity: headerP,
            transform: `translateY(${(1 - headerP) * 8 * u}px)`,
          }}
        >
          <span>{title}</span>
          <span style={{ color: th.faint }}>lower is better</span>
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: headerH,
            height: lanes.length * rowH,
            borderTop: `${Math.max(1, u)}px solid ${th.track}`,
          }}
        >
          {lanes.map((lane, i) => (
            <Lane
              key={lane.label}
              lane={lane}
              index={i}
              winner={i === winnerIndex}
              t={t}
              u={u}
              x0={labelW}
              trackW={trackW}
              valueW={valueW}
              rowH={rowH}
              secPerFrame={secPerFrame}
              decimals={decimals}
              unit={unit}
              accent={accent}
              th={th}
            />
          ))}
        </div>
      </div>

      <Grain opacity={th.grain} />
    </AbsoluteFill>
  );
}
