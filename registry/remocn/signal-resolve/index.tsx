"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { getLength, getPointAtLength } from "@remotion/paths";
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
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

/**
 * Beat sheet (30fps, speed 1):
 * 0–16     several noisy traces jitter across a faint scope graticule.
 * 16–74    a sweep crosses left → right; behind it every trace collapses
 *          into one calm sine. 74–90 the sine holds and drifts.
 * 90–110   the sine flattens to a single line and rises to the R's cap.
 * 110–152  the line runs on into the remocn R, tracing its outline from the
 *          top-left corner; the far end retracts. 150–164 the R fills.
 * 160–208  lockup: the R shrinks into the logo and "emocn" slides out of it,
 *          caption follows. 218–250 hold.
 * The resolved signal, the trace and the R fill carry the gradients.sh
 * "beam" palette; noise stays neutral, so colour means signal.
 */

export interface SignalResolveProps {
  /** Letters that slide out of the R at the end ("R" + name = the logo). */
  name?: string;
  /** Last sentence is set in an italic serif. */
  caption?: string;
  /** Number of noisy traces before they resolve. */
  traces?: number;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

/**
 * The real remocn.dev "R" (viewBox 124.06 × 134.26), re-ordered so the
 * outline starts at the top-left corner and runs right along the cap: the
 * incoming line simply continues into it.
 */
const R_TRACE =
  "M 0.01 0 L 41.85 0.04 C 88.09 0.08 83.93 0.01 87.64 0.83 C 101.93 4.02 114.59 15.81 119.44 30.43 C 124.06 44.32 120.59 58.93 109.97 70.36 C 104.15 76.62 96.18 81.72 88.07 84.38 C 86.36 84.94 85.79 85.25 85.09 86 C 83.66 87.53 83.36 89.89 84.39 91.57 C 84.52 91.78 91.91 101.45 100.82 113.07 L 117.01 134.19 L 106.36 134.23 C 98.97 134.26 95.5 134.23 95.06 134.13 C 94.11 133.93 93.52 133.35 92.82 131.97 C 92.5 131.34 92.07 130.59 91.85 130.32 C 91.63 130.04 85.04 122.28 77.2 113.07 C 69.35 103.85 62.52 95.76 62.02 95.07 C 59.67 91.86 56.61 89.56 53.22 88.45 C 50.75 87.65 50.12 87.59 43.57 87.53 C 39.41 87.5 37.23 87.53 36.45 87.63 C 27.86 88.75 21.79 93.65 19.82 101.04 C 19.08 103.82 19.1 103.27 19.05 119.41 L 19 134.26 L 9.5 134.26 L 0 134.26 L 0.04 116.66 C 0.08 103.13 0.12 98.85 0.25 98.13 C 1.3 91.91 4.86 85.68 10.65 79.89 C 14.84 75.7 19.9 72.15 24.18 70.4 C 27.03 69.23 24.82 69.43 55.2 67.69 C 70.18 66.83 82.81 66.07 83.26 66 C 89.68 64.99 94.66 61.96 97.91 57.07 C 102.53 50.1 103.19 38.56 99.38 31.01 C 96.2 24.68 89.89 20.69 81.32 19.57 C 80.02 19.4 76.07 19.36 51.39 19.27 C 23.18 19.16 22.94 19.16 21.7 18.9 C 13.45 17.16 4.91 11.04 1.09 4.13 C 0.36 2.79 0.01 1.73 0.01 0.81 Z";
const VB = { w: 124.06, h: 134.26 };
/** Manrope: baseline sits 0.883em below the top of a line-height-1 box. */
const MANROPE_ASC = 0.883;
const MANROPE_DESC = 0.117;

/** gradients.sh "beam": [#f4f7ff, #8fb4ff, #3d5bff, #1a1660]. */
const BEAM = {
  dark: {
    line: ["#3D5BFF", "#8FB4FF", "#F4F7FF"],
    mark: ["#F4F7FF", "#8FB4FF", "#3D5BFF"],
  },
  light: {
    line: ["#8FB4FF", "#3D5BFF", "#1A1660"],
    mark: ["#8FB4FF", "#3D5BFF", "#1A1660"],
  },
} as const;

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
    grid: "rgba(255,255,255,0.055)",
    axis: "rgba(255,255,255,0.1)",
    wash: "rgba(255,255,255,0.045)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    grid: "rgba(18,18,20,0.06)",
    axis: "rgba(18,18,20,0.11)",
    wash: "rgba(255,255,255,0.8)",
    grain: 0.045,
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Smooth 1D value noise in [-1, 1]. */
function noise(x: number, seed: number) {
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  const a = hash(i * 1.37 + seed * 91.1) * 2 - 1;
  const b = hash((i + 1) * 1.37 + seed * 91.1) * 2 - 1;
  return a + (b - a) * s;
}

function fbm(x: number, seed: number) {
  return (
    noise(x, seed) * 0.6 +
    noise(x * 2.1, seed + 3) * 0.28 +
    noise(x * 4.3, seed + 7) * 0.12
  );
}

function smoothstep(e0: number, e1: number, x: number) {
  const k = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return k * k * (3 - 2 * k);
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

function Graticule({
  width,
  height,
  cy,
  opacity,
  pal,
  u,
}: {
  width: number;
  height: number;
  cy: number;
  opacity: number;
  pal: Palette;
  u: number;
}) {
  const left = width * 0.07;
  const right = width * 0.93;
  const half = height * 0.3;
  const top = cy - half;
  const bottom = cy + half;
  const cols = 10;
  const rows = 6;
  const lines: React.ReactNode[] = [];
  for (let c = 0; c <= cols; c++) {
    const x = left + ((right - left) * c) / cols;
    lines.push(
      <line
        key={`c${c}`}
        x1={x}
        x2={x}
        y1={top}
        y2={bottom}
        stroke={c === cols / 2 ? pal.axis : pal.grid}
      />,
    );
  }
  for (let r = 0; r <= rows; r++) {
    const y = top + ((bottom - top) * r) / rows;
    lines.push(
      <line
        key={`r${r}`}
        x1={left}
        x2={right}
        y1={y}
        y2={y}
        stroke={r === rows / 2 ? pal.axis : pal.grid}
      />,
    );
  }
  // minor ticks on the axes
  for (let k = 0; k <= cols * 5; k++) {
    const x = left + ((right - left) * k) / (cols * 5);
    lines.push(
      <line
        key={`tx${k}`}
        x1={x}
        x2={x}
        y1={cy - 3 * u}
        y2={cy + 3 * u}
        stroke={pal.axis}
      />,
    );
  }
  for (let k = 0; k <= rows * 5; k++) {
    const y = top + ((bottom - top) * k) / (rows * 5);
    lines.push(
      <line
        key={`ty${k}`}
        x1={width / 2 - 3 * u}
        x2={width / 2 + 3 * u}
        y1={y}
        y2={y}
        stroke={pal.axis}
      />,
    );
  }
  return (
    <g opacity={opacity} strokeWidth={Math.max(1, u)}>
      {lines}
    </g>
  );
}

export function SignalResolve({
  name = "emocn",
  caption = "Less noise. More signal.",
  traces = 5,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: SignalResolveProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const pal = THEMES[theme];
  const beam = BEAM[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const outlineLen = useMemo(() => getLength(R_TRACE), []);

  const cy = height * 0.45;
  const stroke = 1.35 * u;

  // ── lockup geometry (needed early: the line rises to the R's cap) ─────
  const kTrace = 2.45 * u;
  const fontSize = 124 * u;
  const kLock = (fontSize * 0.76) / VB.h;
  const traceCenter = height * 0.47;
  const lineY = traceCenter - (VB.h * kTrace) / 2;

  // ── scope phase ────────────────────────────────────────────────────────
  const sweepX = interpolate(t, [16, 74], [-0.3 * width, 1.3 * width], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const band = width * 0.24;
  const flat = interpolate(t, [90, 110], [1, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const rise = interpolate(t, [88, 112], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const baseY = cy + (lineY - cy) * rise;
  const sineAmp = height * 0.11 * flat;
  const chaosAmp = height * 0.21;
  const N = Math.round(width / 3.2);

  const clean = (x: number, time: number) =>
    baseY + sineAmp * Math.sin((x / width) * Math.PI * 2 * 2.4 + time * 0.07);

  const tracePath = (i: number, time: number, calm = false) => {
    const sweep = interpolate(time, [16, 74], [-0.3 * width, 1.3 * width], {
      ...CLAMP,
      easing: EASE_IO,
    });
    let d = "";
    for (let k = 0; k <= N; k++) {
      const x = (k / N) * width;
      const xn = x / width;
      const r = calm ? 1 : smoothstep(sweep, sweep - band, x);
      let y = clean(x, time);
      if (r < 1) {
        const chaos =
          fbm(xn * (5 + i * 1.3) + time * (0.05 + i * 0.012), i * 7 + 1) *
            0.62 +
          Math.sin(xn * Math.PI * 2 * (2.6 + i * 1.45) + time * 0.19 + i * 2) *
            0.26 +
          noise(xn * 46 + time * 0.9, i * 13 + 5) * 0.12;
        const yc = cy + chaosAmp * chaos * (1.15 - i * 0.07);
        y = yc + (y - yc) * r;
      }
      d += `${k === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };

  const resolved = t >= 76;
  const scopeVisible = t < 110;
  const traceEls: React.ReactNode[] = [];
  if (scopeVisible && !resolved) {
    for (let i = 0; i < traces; i++) {
      const base = 0.9 - (i / Math.max(1, traces)) * 0.5;
      // phosphor persistence: the previous sweeps of the beam linger
      for (const lag of [3.6, 2.4, 1.2, 0]) {
        const o = lag === 0 ? 1 : lag < 2 ? 0.32 : lag < 3 ? 0.15 : 0.07;
        traceEls.push(
          <path
            key={`${i}-${lag}`}
            d={tracePath(i, t - lag)}
            fill="none"
            stroke={pal.fg}
            strokeWidth={stroke}
            strokeLinejoin="round"
            opacity={base * o * 0.75}
          />,
        );
      }
    }
  }

  const gratO =
    interpolate(t, [0, 12], [0.6, 1], CLAMP) *
    interpolate(t, [92, 116], [1, 0], { ...CLAMP, easing: EASE_IO });

  // sweep marker: a hairline and the point where the signal locks
  const sweepOn = t > 16 && t < 74;
  const sweepO =
    interpolate(t, [16, 24], [0, 1], CLAMP) *
    interpolate(t, [64, 74], [1, 0], CLAMP);
  const lockX = sweepX - band * 0.85;
  const lockY = clean(lockX, t);
  // the beam colour paints the signal only where it has resolved
  const paintX = resolved ? width : Math.max(0, sweepX - band * 0.55);

  // ── lockup ────────────────────────────────────────────────────────────
  const lock = interpolate(t, [160, 188], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const k = kTrace + (kLock - kTrace) * lock;
  const markW = VB.w * k;
  const markH = VB.h * k;
  const centerY = interpolate(lock, [0, 1], [traceCenter, height * 0.43]);
  const baselineY = centerY + markH / 2;
  const slide = interpolate(t, [176, 204], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const wordClip = interpolate(t, [179, 208], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  // the outline starts at the R's top-left corner, right on the line
  const entryX = width / 2 - (VB.w * kTrace) / 2;

  // ── reel-in: lead line + outline trace ───────────────────────────────
  const reeling = t >= 110;
  const head = interpolate(t, [110, 152], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const tailX = interpolate(t, [112, 150], [0, entryX], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const rightEnd = interpolate(t, [110, 128], [width, entryX], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const fillIn = interpolate(t, [148, 166], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const beamPt =
    head > 0 && head < 1
      ? getPointAtLength(R_TRACE, outlineLen * head)
      : undefined;
  const beamO = interpolate(head, [0, 0.04, 0.94, 1], [0, 1, 1, 0], CLAMP);

  // ── caption: the last sentence turns to an italic serif ───────────────
  const sentences = caption.split(/(?<=[.!?\u2026])\s+/);
  const words: { w: string; serif: boolean }[] = [];
  sentences.forEach((sentence, si) => {
    for (const w of sentence.split(" ")) {
      words.push({
        w,
        serif: sentences.length > 1 && si === sentences.length - 1,
      });
    }
  });
  const word = (i: number) =>
    interpolate(t, [198 + i * 3, 218 + i * 3], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const edgeMask = `linear-gradient(90deg, transparent 0%, #000 9%, #000 91%, transparent 100%)`;
  const localStroke = stroke / k;
  const lineGrad = `url(#l${uid})`;

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 45%, ${pal.wash}, transparent 75%)`,
        }}
      />

      {/* scope */}
      <AbsoluteFill
        style={{
          WebkitMaskImage: reeling ? undefined : edgeMask,
          maskImage: reeling ? undefined : edgeMask,
        }}
      >
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient id={`h${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={pal.fg} stopOpacity={0} />
              <stop offset="0.5" stopColor={pal.fg} stopOpacity={0.42} />
              <stop offset="1" stopColor={pal.fg} stopOpacity={0} />
            </linearGradient>
            <linearGradient
              id={`l${uid}`}
              gradientUnits="userSpaceOnUse"
              x1={width * 0.05}
              y1={0}
              x2={width * 0.95}
              y2={0}
            >
              <stop offset="0" stopColor={beam.line[0]} />
              <stop offset="0.5" stopColor={beam.line[1]} />
              <stop offset="1" stopColor={beam.line[2]} />
            </linearGradient>
            <linearGradient
              id={`f${uid}`}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={0}
              x2={entryX}
              y2={0}
            >
              <stop offset="0" stopColor="#fff" stopOpacity={0} />
              <stop offset="0.4" stopColor="#fff" stopOpacity={0.6} />
              <stop offset="1" stopColor="#fff" stopOpacity={1} />
            </linearGradient>
            <mask id={`m${uid}`} maskUnits="userSpaceOnUse">
              <rect
                x={0}
                y={0}
                width={width}
                height={height}
                fill={`url(#f${uid})`}
              />
            </mask>
            <clipPath id={`c${uid}`}>
              <rect x={0} y={0} width={paintX} height={height} />
            </clipPath>
          </defs>
          <Graticule
            width={width}
            height={height}
            cy={cy}
            opacity={gratO}
            pal={pal}
            u={u}
          />
          {traceEls}
          {scopeVisible && paintX > 0 ? (
            <path
              d={tracePath(0, t, true)}
              fill="none"
              stroke={lineGrad}
              strokeWidth={stroke * 1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              clipPath={`url(#c${uid})`}
            />
          ) : null}
          {sweepOn ? (
            <g opacity={sweepO}>
              <rect
                x={lockX - 0.5 * u}
                y={cy - height * 0.3}
                width={Math.max(1, u)}
                height={height * 0.6}
                fill={`url(#h${uid})`}
              />
              <circle
                cx={lockX}
                cy={lockY}
                r={5 * u}
                fill={accent}
                stroke={pal.bg}
                strokeWidth={2 * u}
              />
            </g>
          ) : null}
          {reeling ? (
            <g>
              {/* the far end retracts toward the R */}
              {rightEnd > entryX + 0.5 ? (
                <line
                  x1={entryX}
                  x2={rightEnd}
                  y1={lineY}
                  y2={lineY}
                  stroke={lineGrad}
                  strokeWidth={stroke * 1.5}
                />
              ) : null}
              {/* the lead is reeled in; it fades toward its tail */}
              {tailX < entryX - 0.5 ? (
                <line
                  x1={tailX}
                  x2={entryX}
                  y1={lineY}
                  y2={lineY}
                  stroke={lineGrad}
                  strokeWidth={stroke * 1.5}
                  mask={`url(#m${uid})`}
                />
              ) : null}
            </g>
          ) : null}
        </svg>
      </AbsoluteFill>

      {/* R + "emocn": the traced R becomes the logo's first letter */}
      {reeling ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: baselineY - Math.max(markH, MANROPE_ASC * fontSize),
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              transform: `translateX(calc(${(1 - slide) * 50}% - ${(1 - slide) * (markW / 2)}px))`,
            }}
          >
            <svg
              width={markW}
              height={markH}
              viewBox={`0 0 ${VB.w} ${VB.h}`}
              style={{ overflow: "visible", flexShrink: 0 }}
              aria-hidden
            >
              <defs>
                <linearGradient id={`r${uid}`} x1="0" y1="0" x2="0.85" y2="1">
                  <stop offset="0" stopColor={beam.mark[0]} />
                  <stop offset="0.5" stopColor={beam.mark[1]} />
                  <stop offset="1" stopColor={beam.mark[2]} />
                </linearGradient>
              </defs>
              <path
                d={R_TRACE}
                fill={`url(#r${uid})`}
                fillOpacity={fillIn}
                stroke={`url(#r${uid})`}
                strokeWidth={localStroke * 1.5}
                strokeLinejoin="round"
                pathLength={1}
                strokeDasharray={`${head} 2`}
              />
              {beamPt ? (
                <circle
                  cx={beamPt.x}
                  cy={beamPt.y}
                  r={(3 * u) / k}
                  fill={beam.mark[theme === "dark" ? 0 : 2]}
                  opacity={beamO}
                />
              ) : null}
            </svg>
            <div
              style={{
                clipPath: `inset(-20% ${(1 - wordClip) * 100}% -20% 0)`,
                fontFamily: manrope.fontFamily,
                fontWeight: 600,
                fontSize,
                lineHeight: 1,
                letterSpacing: "-0.025em",
                marginLeft: "0.04em",
                color: pal.fg,
                paddingRight: 6 * u,
                transform: `translateX(${(1 - wordClip) * -28 * u}px)`,
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </div>
          </div>
        </div>
      ) : null}

      {/* caption */}
      <div
        style={{
          position: "absolute",
          left: "12%",
          right: "12%",
          top:
            height * 0.43 +
            (VB.h * kLock) / 2 +
            MANROPE_DESC * fontSize +
            34 * u,
          textAlign: "center",
          fontFamily: sans,
          fontWeight: 400,
          fontSize: 32 * u,
          lineHeight: 1.3,
          letterSpacing: "-0.012em",
          color: pal.muted,
          textWrap: "balance",
        }}
      >
        {words.map(({ w, serif: isSerif }, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              fontFamily: isSerif ? serif : undefined,
              fontStyle: isSerif ? "italic" : undefined,
              fontSize: isSerif ? "1.14em" : undefined,
              letterSpacing: isSerif ? "-0.005em" : undefined,
              color: isSerif ? pal.fg : undefined,
              opacity: word(i),
              transform: `translateY(${(1 - word(i)) * 10 * u}px)`,
              filter: `blur(${(1 - word(i)) * 4 * u}px)`,
            }}
          >
            {i < words.length - 1 ? `${w} ` : w}
          </span>
        ))}
      </div>

      <Grain opacity={pal.grain} />
    </AbsoluteFill>
  );
}
