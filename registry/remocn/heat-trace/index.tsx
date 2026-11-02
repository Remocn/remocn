"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { Fragment, useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});
const geist = loadGeist("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface HeatTraceProps {
  name?: string;
  logo?: React.ReactNode;
  tagline?: string;
  eyebrow?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    muted: "#8E8D94",
    eyebrow: "#B4B3B9",
    ramp: (accent: string) => [
      "#16171D",
      "#1a1f63",
      accent,
      "#e2457a",
      "#ffb36b",
      "#fff4ec",
    ],
    bloom: 0.13,
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    muted: "#6E6C67",
    eyebrow: "#4A4945",
    ramp: (accent: string) => [
      "#E5E2DA",
      "#A8B4F2",
      accent,
      "#d93d73",
      "#f06a24",
      "#b8400f",
    ],
    bloom: 0,
    grain: 0.035,
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_PASS = Easing.bezier(0.42, 0, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

const R_RATIO = 124.06 / 134.26;
const R_H = 0.76;
const R_W = R_H * R_RATIO;
const R_GAP = 0.04;

const MANROPE_500 = [
  200, 329, 417, 924, 602, 901, 657, 229, 435, 435, 446, 575, 278, 420, 270,
  402, 626, 406, 578, 562, 596, 580, 621, 512, 591, 621, 314, 318, 622, 750,
  622, 534, 907, 646, 619, 723, 681, 575, 510, 714, 697, 249, 476, 612, 518,
  846, 696, 732, 616, 732, 640, 630, 600, 708, 616, 949, 622, 574, 630, 412,
  402, 412, 673, 660, 506, 562, 600, 561, 600, 590, 362, 600, 604, 249, 263,
  510, 249, 865, 604, 600, 600, 600, 374, 530, 412, 604, 523, 779, 536, 538,
  531, 430, 269, 430, 680,
];
const MANROPE_600_EMOCN = (596 + 882 + 610 + 568 + 615) / 1000;
const GEIST_500 = [
  243, 230, 349, 513, 632, 853, 668, 174, 329, 329, 420, 563, 186, 432, 186,
  457, 677, 374, 614, 600, 629, 629, 610, 507, 629, 613, 227, 227, 547, 544,
  547, 517, 901, 678, 681, 704, 701, 610, 596, 692, 705, 281, 592, 652, 584,
  883, 738, 739, 653, 739, 673, 642, 558, 696, 688, 956, 633, 586, 557, 342,
  439, 342, 438, 532, 257, 556, 591, 549, 591, 566, 413, 591, 581, 256, 274,
  565, 283, 852, 581, 562, 592, 591, 394, 535, 414, 587, 548, 806, 559, 540,
  499, 405, 274, 406, 522,
];

function textEm(text: string, table: number[]) {
  let w = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += c >= 32 && c <= 126 ? table[c - 32] : 600;
  }
  return w / 1000;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
}

function rampTables(ramp: readonly string[]) {
  const rgb = ramp.map(hexToRgb);
  return [0, 1, 2].map((ch) => rgb.map((c) => c[ch].toFixed(4)).join(" ")) as [
    string,
    string,
    string,
  ];
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
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

export function HeatTrace({
  name = "remocn",
  logo,
  tagline = "Launch-video scenes for Remotion. Copy, paste, render.",
  eyebrow = "",
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: HeatTraceProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const t = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ids = {
    mask: `hm${uid}`,
    heat: `hf${uid}`,
    bloom: `hb${uid}`,
    blob: `hg${uid}`,
    field: `hl${uid}`,
  };

  const portrait = height > width * 1.1;
  const s = portrait
    ? (width / 1280) * 1.5
    : Math.min(width / 1280, height / 720);

  const wordmark = logo === undefined && name.trim().toLowerCase() === "remocn";

  const LS = -0.035;
  const chars = wordmark ? 5 : [...name].length;
  const markEm = wordmark ? R_W + R_GAP : logo ? 0.84 + 0.18 : 0;
  const textBase = wordmark ? MANROPE_600_EMOCN : textEm(name, MANROPE_500);
  const nameEm = markEm + textBase + chars * LS;
  const maxW = width * (portrait ? 0.86 : 0.8);
  const fs = Math.min((portrait ? 168 : 210) * s, maxW / nameEm);
  const nameW = nameEm * fs;

  const eyeFs = 22 * s;
  const tagFs = (portrait ? 34 : 30) * s;
  const tagMax = Math.min(width * 0.8, 980 * s);
  const tagLines = tagline
    ? Math.max(1, Math.ceil((textEm(tagline, GEIST_500) * tagFs) / tagMax))
    : 0;
  const tagH = tagLines * tagFs * 1.3;
  const inkH = fs * 0.78;
  const eyeGap = eyebrow ? eyeFs + fs * 0.24 : 0;
  const tagGap = tagline ? fs * 0.3 + tagH : 0;
  const groupH = eyeGap + inkH + tagGap;
  const top = height / 2 - groupH / 2 - (tagline ? 0 : fs * 0.04);
  const inkTop = top + eyeGap;
  const baseline = inkTop + inkH - fs * 0.02;
  const x0 = width / 2 - nameW / 2;
  const x1 = x0 + nameW;
  const tagTop = inkTop + inkH + fs * 0.3;

  const PASS_END = 56;
  const headAt = (f: number) => {
    const u = interpolate(f, [0, PASS_END], [0, 1], {
      ...CLAMP,
      easing: EASE_PASS,
    });
    const x = interpolate(u, [0, 1], [x0 + fs * 0.12, x1 + fs * 0.35]);
    const y =
      baseline - fs * 0.38 + fs * 0.2 * Math.sin(u * Math.PI * 2.4 + 0.5);
    return { x, y };
  };
  const trailPts: string[] = [];
  const trailEnd = Math.min(frame, PASS_END);
  for (let f = 0; f <= trailEnd + 0.001; f += 1) {
    const p = headAt(Math.min(f, trailEnd));
    trailPts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  if (trailPts.length === 1) trailPts.push(trailPts[0]);

  const blobs = Array.from({ length: 9 }, (_, k) => {
    const age = k * 2.2;
    const f = frame - age;
    if (f < -1) return null;
    const p = headAt(Math.max(0, f));
    const leaving = interpolate(frame, [PASS_END - 6, PASS_END + 14], [1, 0], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    return {
      key: `b${k}`,
      cx: p.x,
      cy: p.y,
      r: fs * (0.46 + age * 0.018),
      o: Math.exp(-age / 7) * 0.95 * leaving,
    };
  }).filter((b): b is NonNullable<typeof b> => b !== null);

  const settle = interpolate(frame, [46, 90], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const trailO = interpolate(
    frame,
    [0, 6, PASS_END, 92],
    [0.4, 0.48, 0.5, 0.12],
    CLAMP,
  );
  const cores = [
    { fx: 0.08, dy: 0.62, r: 0.78, a: 0.86 },
    { fx: 0.54, dy: 0.56, r: 0.66, a: 0.66 },
    { fx: 0.92, dy: 0.22, r: 0.62, a: 0.58 },
  ].map((c, i) => ({
    key: `c${i}`,
    cx: x0 + nameW * c.fx + Math.sin(frame * 0.035 + i * 2.1) * fs * 0.1,
    cy: baseline - fs * c.dy + Math.cos(frame * 0.03 + i * 1.3) * fs * 0.05,
    r: fs * c.r * interpolate(settle, [0, 1], [0.7, 1]),
    o: c.a * settle,
  }));

  const [tr, tg, tb] = rampTables(t.ramp(accent));
  const pad = fs * 0.7;
  const region = {
    x: x0 - pad,
    y: baseline - fs * 1.2,
    w: nameW + pad * 2,
    h: fs * 1.6,
  };
  const blur = fs * 0.11;

  const transparent = background === "transparent";
  const showStage = !transparent && background === undefined;

  const bloomO = interpolate(frame, [0, 10, 60, 96], [0.6, 1, 1, 0.35], CLAMP);

  const heatContent = (withGround: boolean) => (
    <>
      {withGround ? (
        <rect
          x={region.x}
          y={region.y}
          width={region.w}
          height={region.h}
          fill="#000"
        />
      ) : null}
      {withGround ? (
        <rect
          x={region.x}
          y={region.y}
          width={region.w}
          height={region.h}
          fill={`url(#${ids.field})`}
          opacity={settle}
        />
      ) : null}
      <polyline
        points={trailPts.join(" ")}
        fill="none"
        stroke="#fff"
        strokeOpacity={trailO}
        strokeWidth={fs * 0.95}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {[...blobs, ...cores].map((b) => (
        <circle
          key={b.key}
          cx={b.cx}
          cy={b.cy}
          r={b.r}
          fill={`url(#${ids.blob})`}
          opacity={b.o}
        />
      ))}
    </>
  );

  const words = tagline.split(/\s+/).filter(Boolean);
  const markX = x0;
  const textX = x0 + markEm * fs;
  const logoLit = interpolate(
    headAt(frame).x,
    [markX, markX + fs * 0.9],
    [0.18, 1],
    CLAMP,
  );

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? t.bg),
        overflow: "hidden",
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
          <radialGradient id={ids.blob}>
            <stop offset="0" stopColor="#fff" stopOpacity={1} />
            <stop offset="0.3" stopColor="#fff" stopOpacity={0.8} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <linearGradient
            id={ids.field}
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="0"
            y1={baseline - fs * 0.8}
            y2={baseline}
          >
            <stop offset="0" stopColor="#fff" stopOpacity={0.44} />
            <stop offset="1" stopColor="#fff" stopOpacity={0.3} />
          </linearGradient>
          <filter
            id={ids.heat}
            filterUnits="userSpaceOnUse"
            x={region.x}
            y={region.y}
            width={region.w}
            height={region.h}
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation={blur} />
            <feComponentTransfer>
              <feFuncR type="table" tableValues={tr} />
              <feFuncG type="table" tableValues={tg} />
              <feFuncB type="table" tableValues={tb} />
            </feComponentTransfer>
          </filter>
          <filter
            id={ids.bloom}
            filterUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={width}
            height={height}
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation={fs * 0.42} />
            <feComponentTransfer>
              <feFuncR type="table" tableValues={tr} />
              <feFuncG type="table" tableValues={tg} />
              <feFuncB type="table" tableValues={tb} />
            </feComponentTransfer>
          </filter>
          <mask id={ids.mask} maskUnits="userSpaceOnUse">
            {wordmark ? (
              <path
                d={REMOCN_R_PATH}
                fill="#fff"
                transform={`translate(${markX} ${baseline - R_H * fs}) scale(${(R_H * fs) / 134.26})`}
              />
            ) : null}
            <text
              x={textX}
              y={baseline}
              fill="#fff"
              fontFamily={manrope.fontFamily}
              fontWeight={wordmark ? 600 : 500}
              fontSize={fs}
              letterSpacing={LS * fs}
            >
              {wordmark ? "emocn" : name}
            </text>
          </mask>
        </defs>

        {showStage ? (
          <g filter={`url(#${ids.bloom})`} opacity={t.bloom * bloomO}>
            {heatContent(false)}
          </g>
        ) : null}

        <g mask={`url(#${ids.mask})`}>
          <g filter={`url(#${ids.heat})`}>{heatContent(true)}</g>
        </g>
      </svg>

      {logo && !wordmark ? (
        <div
          style={{
            position: "absolute",
            left: markX,
            top: baseline - fs * 0.8,
            width: fs * 0.84,
            height: fs * 0.84,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: logoLit,
            filter: `blur(${(1 - logoLit) * 6 * s}px)`,
          }}
        >
          {logo}
        </div>
      ) : null}

      {eyebrow ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top,
            textAlign: "center",
            fontFamily: geist.fontFamily,
            fontWeight: 500,
            fontSize: eyeFs,
            lineHeight: 1,
            letterSpacing: "0.02em",
            color: t.eyebrow,
            opacity: interpolate(frame, [4, 20], [0, 1], CLAMP),
          }}
        >
          {eyebrow}
        </div>
      ) : null}

      {tagline ? (
        <div
          style={{
            position: "absolute",
            left: (width - tagMax) / 2,
            width: tagMax,
            top: tagTop,
            textAlign: "center",
            textWrap: "balance",
            fontFamily: geist.fontFamily,
            fontWeight: 400,
            fontSize: tagFs,
            lineHeight: 1.3,
            letterSpacing: "-0.012em",
            color: t.muted,
          }}
        >
          {words.map((w, i) => {
            const k = interpolate(frame, [58 + i * 2, 76 + i * 2], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            });
            return (
              <Fragment key={i}>
                {i > 0 ? " " : null}
                <span
                  style={{
                    display: "inline-block",
                    opacity: k,
                    transform: `translateY(${(1 - k) * 0.45}em)`,
                    filter: `blur(${(1 - k) * 6 * s}px)`,
                  }}
                >
                  {w}
                </span>
              </Fragment>
            );
          })}
        </div>
      ) : null}

      {showStage ? <Grain opacity={t.grain} /> : null}
    </AbsoluteFill>
  );
}
