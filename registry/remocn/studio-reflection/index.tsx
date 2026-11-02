"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadLexendExa } from "@remotion/google-fonts/LexendExa";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const exa = loadLexendExa("normal", { weights: ["400"], subsets: ["latin"] });
const geist = loadGeist("normal", { weights: ["400"], subsets: ["latin"] });
const mono = loadGeistMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface StudioReflectionProps {
  value?: string;
  label?: string;
  eyebrow?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const WAVES = ["#a9c1df", "#5479b0", "#24467e", "#0f1c38"] as const;
const SPECULAR = "#f4f7ff";

const PALETTES = {
  dark: {
    bg: "#0A0A0B",
    body: "#121318",
    reflect: SPECULAR,
    fg: "#F4F3F0",
    muted: "#8E8D94",
    ground: "#05070d",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    body: "#E7E6E2",
    reflect: WAVES[3],
    fg: "#111113",
    muted: "#6E6C67",
    ground: "#e9ecf2",
    grain: 0.035,
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_GLIDE = Easing.bezier(0.45, 0.05, 0.55, 0.95);
const EASE_PARK = Easing.bezier(0.3, 0.1, 0.1, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const EXA_400 = [
  362, 361, 494, 781, 748, 967, 852, 271, 492, 492, 496, 707, 363, 480, 356,
  653, 694, 565, 639, 623, 683, 644, 651, 604, 673, 641, 356, 387, 622, 678,
  622, 638, 1093, 817, 807, 800, 872, 738, 720, 892, 884, 628, 738, 868, 719,
  989, 924, 910, 762, 910, 821, 748, 684, 862, 810, 1108, 796, 780, 749, 501,
  653, 501, 691, 776, 500, 773, 777, 673, 766, 724, 528, 790, 763, 382, 399,
  721, 360, 1123, 763, 751, 782, 769, 554, 606, 530, 755, 691, 898, 734, 726,
  582, 550, 337, 550, 642,
];
const CAP = 0.7;
const TRACK = -0.035;

function textEm(text: string) {
  let w = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += (c >= 32 && c <= 126 ? EXA_400[c - 32] : 700) / 1000;
  }
  return w;
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
          seed={5}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

type Band = {
  from: number;
  to: number;
  t0: number;
  t1: number;
  core: number;
  soft: number;
  peak: number;
  park?: boolean;
};

const BANDS: Band[] = [
  { from: -0.15, to: 1.2, t0: 6, t1: 30, core: 0.008, soft: 0.03, peak: 1 },
  { from: -0.35, to: 1.35, t0: 12, t1: 46, core: 0.035, soft: 0.16, peak: 0.8 },
  { from: -0.15, to: 1.2, t0: 22, t1: 48, core: 0.01, soft: 0.04, peak: 0.95 },
  {
    from: -0.25,
    to: 0.5,
    t0: 30,
    t1: 64,
    core: 0.012,
    soft: 0.09,
    peak: 1,
    park: true,
  },
];
const HORIZON = 0.5;

export function StudioReflection({
  value = "250+",
  label = "launch-ready scenes, one command away",
  eyebrow = "In the library",
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: StudioReflectionProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const p = PALETTES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = `c${uid}`;
  const chromeId = `ch${uid}`;
  const blurId = `b${uid}`;

  const portrait = height > width * 1.1;
  const s = portrait
    ? (width / 1280) * 1.5
    : Math.min(width / 1280, height / 720);

  const chars = [...value].length;
  const valueEm = textEm(value) + TRACK * Math.max(0, chars - 1);
  const maxW = width * (portrait ? 0.88 : 0.84);
  const fs = Math.min(
    (portrait ? 300 : 330) * s,
    maxW / Math.max(0.5, valueEm),
    (height * (portrait ? 0.3 : 0.46)) / CAP,
  );
  const capH = CAP * fs;
  const valueW = valueEm * fs;

  const eyeFs = (portrait ? 22 : 17) * s;
  const labelFs = (portrait ? 36 : 30) * s;
  const labelMax = Math.min(width * 0.8, 900 * s);
  const eyeGap = Math.max(capH * 0.2, 26 * s);
  const descends = /[$,;()[\]{}|gjpqy]/.test(value);
  const labelGap = Math.max(capH * 0.22, 30 * s) + (descends ? fs * 0.14 : 0);
  const labelLines = label
    ? Math.max(1, Math.ceil((label.length * 0.52 * labelFs) / labelMax))
    : 0;
  const labelH = labelLines * labelFs * 1.3;
  const groupH =
    (eyebrow ? eyeFs + eyeGap : 0) + capH + (label ? labelGap + labelH : 0);
  const top = height / 2 - groupH / 2;
  const figTop = top + (eyebrow ? eyeFs + eyeGap : 0);
  const baseline = figTop + capH;
  const yOf = (v: number) => figTop + v * capH;
  const x0 = width / 2 - valueW / 2 - fs * 0.1;
  const x1 = width / 2 + valueW / 2 + fs * 0.1;

  const ambient = interpolate(frame, [0, 40], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.5, 0, 0.5, 1),
  });
  const parked = BANDS[BANDS.length - 1];
  const chrome = interpolate(frame, [parked.t1 - 16, parked.t1 + 8], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const bandEls = BANDS.map((b, i) => {
    const t = interpolate(frame, [b.t0, b.t1], [0, 1], {
      ...CLAMP,
      easing: b.park ? EASE_PARK : EASE_GLIDE,
    });
    if (frame < b.t0) return null;
    const life = b.park
      ? 1
      : interpolate(t, [0, 0.08, 0.85, 1], [0, 1, 1, 0], CLAMP);
    const v = b.from + (b.to - b.from) * t;
    const y = yOf(v);
    const core = Math.max(1.2, b.core * capH);
    const soft = b.soft * capH;
    const o = life * b.peak;
    return (
      <g key={i} opacity={o}>
        <rect
          x={x0}
          y={y - soft - core / 2}
          width={x1 - x0}
          height={soft * 2 + core}
          fill={`url(#${uid}soft)`}
        />
        <rect
          x={x0}
          y={y - core / 2}
          width={x1 - x0}
          height={core}
          fill={p.reflect}
        />
      </g>
    );
  });

  const push = interpolate(frame, [0, 120], [1.06, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const drift = interpolate(frame, [0, 120], [10 * s, 0], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const eyeIn = interpolate(frame, [50, 72], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelIn = interpolate(frame, [56, 82], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const transparent = background === "transparent";
  const bg = transparent ? "transparent" : (background ?? p.bg);

  const hz = HORIZON;
  const chromeStops: [number, string][] =
    theme === "dark"
      ? [
          [0, WAVES[3]],
          [0.16, WAVES[2]],
          [hz - 0.18, WAVES[1]],
          [hz - 0.06, WAVES[0]],
          [hz - 0.004, SPECULAR],
          [hz + 0.004, "#0b1226"],
          [hz + 0.18, WAVES[3]],
          [0.84, WAVES[2]],
          [1, WAVES[0]],
        ]
      : [
          [0, WAVES[3]],
          [0.25, WAVES[2]],
          [hz - 0.08, WAVES[1]],
          [hz - 0.004, WAVES[0]],
          [hz + 0.004, WAVES[3]],
          [hz + 0.25, WAVES[2]],
          [1, WAVES[1]],
        ];

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {!transparent ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: chrome,
            background: `radial-gradient(${width * 0.7}px ${height * 0.38}px at 50% ${yOf(hz)}px, color-mix(in oklab, ${WAVES[2]} ${theme === "dark" ? 28 : 10}%, transparent) 0%, transparent 100%)`,
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${drift}px) scale(${push})`,
          transformOrigin: `50% ${(yOf(hz) / height) * 100}%`,
        }}
      >
        {eyebrow ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: top,
              height: eyeFs,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: eyeFs * 0.7,
              opacity: eyeIn,
              transform: `translateY(${(1 - eyeIn) * eyeFs * 0.6}px)`,
            }}
          >
            <div
              style={{
                width: eyeFs * 0.36,
                height: eyeFs * 0.36,
                borderRadius: 1,
                background: accent,
              }}
            />
            <span
              style={{
                fontFamily: mono.fontFamily,
                fontWeight: 400,
                fontSize: eyeFs,
                lineHeight: 1,
                textTransform: "uppercase",
                letterSpacing: "0.22em",
                marginRight: "-0.22em",
                color: p.muted,
                whiteSpace: "nowrap",
              }}
            >
              {eyebrow}
            </span>
          </div>
        ) : null}

        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          <defs>
            <clipPath id={clipId}>
              <text
                x={width / 2}
                y={baseline}
                textAnchor="middle"
                fontFamily={exa.fontFamily}
                fontWeight={400}
                fontSize={fs}
                letterSpacing={`${TRACK}em`}
              >
                {value}
              </text>
            </clipPath>
            <linearGradient
              id={chromeId}
              gradientUnits="userSpaceOnUse"
              x1="0"
              x2="0"
              y1={yOf(0)}
              y2={yOf(1)}
            >
              {chromeStops.map(([o, c]) => (
                <stop key={o} offset={o} stopColor={c} />
              ))}
            </linearGradient>
            <linearGradient id={`${uid}soft`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={p.reflect} stopOpacity={0} />
              <stop offset="0.5" stopColor={p.reflect} stopOpacity={0.55} />
              <stop offset="1" stopColor={p.reflect} stopOpacity={0} />
            </linearGradient>
            <filter id={blurId} x="-10%" y="-50%" width="120%" height="200%">
              <feGaussianBlur stdDeviation={3 * s} />
            </filter>
          </defs>

          <g clipPath={`url(#${clipId})`}>
            <rect
              x={x0}
              y={yOf(-0.3)}
              width={x1 - x0}
              height={capH * 1.6}
              fill={p.body}
              opacity={0.35 + 0.65 * ambient}
            />
            <rect
              x={x0}
              y={yOf(-0.3)}
              width={x1 - x0}
              height={capH * 1.6}
              fill={`url(#${chromeId})`}
              opacity={chrome}
            />
            <g filter={`url(#${blurId})`}>{bandEls}</g>
            <g>{bandEls}</g>
          </g>
        </svg>

        {label ? (
          <div
            style={{
              position: "absolute",
              left: (width - labelMax) / 2,
              width: labelMax,
              top: baseline + labelGap,
              height: labelH + labelFs * 0.4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                transform: `translateY(${(1 - labelIn) * labelFs * 1.4}px)`,
                opacity: interpolate(labelIn, [0, 0.5], [0, 1], CLAMP),
                textAlign: "center",
                textWrap: "balance",
                fontFamily: geist.fontFamily,
                fontWeight: 400,
                fontSize: labelFs,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                color: p.muted,
              }}
            >
              {label}
            </div>
          </div>
        ) : null}
      </div>

      {!transparent ? <Grain opacity={p.grain} /> : null}
    </AbsoluteFill>
  );
}
