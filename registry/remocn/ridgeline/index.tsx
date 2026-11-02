"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: bricolage } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface RidgelineProps {
  labels?: string[];
  highlightLabel?: string;
  value?: string;
  caption?: string;
  axisLabel?: string;
  ticks?: string[];
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_LABELS = ["2020", "2021", "2022", "2023", "2024", "2025"];
const DEFAULT_TICKS = ["0", "5", "10", "15", "20", "25", "30"];

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
    line: "#9A999F",
    axis: "rgba(255,255,255,0.18)",
    // gradients.sh "aurora" across the hero ridge; third stop follows `accent`
    aurora: ["#a0f0c8", "#3fb5a3", "accent", "#b25c9c"],
    tint: 0.62,
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    line: "#7D7B76",
    axis: "rgba(18,18,20,0.2)",
    aurora: ["#3fb5a3", "#2f9c8c", "accent", "#b25c9c"],
    tint: 0.32,
    grain: 0.045,
  },
} as const;

const BASE_AT = 0;
const BASE_STAGGER = 3;
const BASE_DRAW = 22;
const RISE_AT = 12;
const RISE_STAGGER = 7;
const ACCENT_RISE = 58;
const SHIFT = [62, 100] as const;
const HIT = 96;
const SAMPLES = 180;

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
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
          seed={29}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const gauss = (x: number, m: number, s: number) =>
  Math.exp(-((x - m) ** 2) / (2 * s * s));

interface Shape {
  m: number;
  s: number;
  m2: number;
  s2: number;
  w2: number;
}

function shapeFor(i: number, n: number): Shape {
  const k = n > 1 ? i / (n - 1) : 0;
  const side = hash(i + 7.7) > 0.45 ? 1 : -1;
  return {
    m: 0.25 + 0.14 * k + (hash(i + 0.7) - 0.5) * 0.04,
    s: 0.055 + 0.03 * hash(i + 3.1),
    m2: 0.25 + 0.14 * k + side * (0.08 + 0.06 * hash(i + 5.3)),
    s2: 0.035 + 0.025 * hash(i + 8.9),
    w2: 0.35 + 0.5 * hash(i + 2.2),
  };
}

function density(x: number, sh: Shape, shift: number) {
  return gauss(x, sh.m + shift, sh.s) + sh.w2 * gauss(x, sh.m2 + shift, sh.s2);
}

function peakOf(sh: Shape) {
  let best = 0;
  for (let i = 0; i <= 200; i++) best = Math.max(best, density(i / 200, sh, 0));
  return best || 1;
}

export function Ridgeline({
  labels = DEFAULT_LABELS,
  highlightLabel = "With remocn",
  value = "2.6×",
  caption = "more videos per team",
  axisLabel = "videos per team, per month",
  ticks = DEFAULT_TICKS,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: RidgelineProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const u = Math.min(W / 1280, H / 720);
  const p = THEMES[theme];

  const greys = labels.slice(0, 6);
  const n = greys.length + 1;
  const x0 = W * 0.19;
  const x1 = W * 0.92;
  const yFirst = H * 0.36;
  const yLast = H * 0.82;
  const gap = n > 1 ? (yLast - yFirst) / (n - 1) : 0;
  const greyH = Math.min(gap * 2.3, H * 0.17);
  const accentH = Math.min(gap * 4, H * 0.33);

  const push = interpolate(t, [0, HIT + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const camScale = 0.975 + 0.025 * push;
  const shift = interpolate(t, SHIFT, [0, 1], { ...CLAMP, easing: EASE_IO });

  const rows = Array.from({ length: n }, (_, i) => {
    const isHl = i === n - 1;
    const sh = isHl
      ? { m: 0.4, s: 0.085, m2: 0.5, s2: 0.06, w2: 0.45 }
      : shapeFor(i, n - 1);
    const norm = peakOf(sh);
    const baseStart = BASE_AT + i * BASE_STAGGER;
    const draw = interpolate(t, [baseStart, baseStart + BASE_DRAW], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
    const riseAt = isHl ? ACCENT_RISE : RISE_AT + i * RISE_STAGGER;
    const rise = spring({
      frame: t - riseAt,
      fps,
      config: isHl
        ? { damping: 20, stiffness: 70, mass: 1 }
        : { damping: 18, stiffness: 110, mass: 0.8 },
    });
    const amp = (isHl ? accentH : greyH * (0.86 + 0.14 * hash(i + 4.4))) * rise;
    const off = isHl ? 0.28 * shift : 0;
    return {
      i,
      isHl,
      sh,
      norm,
      draw,
      amp,
      off,
      label: isHl ? highlightLabel : greys[i],
      y: yFirst + i * gap,
      labelIn: interpolate(t, [baseStart + 4, baseStart + 18], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      }),
    };
  });

  const paths = rows.map((r) => {
    const end = Math.max(0.0001, r.draw);
    const pts: string[] = [];
    const steps = Math.max(2, Math.ceil(SAMPLES * end));
    for (let k = 0; k <= steps; k++) {
      const nx = (end * k) / steps;
      const yv = (density(nx, r.sh, r.off) / r.norm) * r.amp;
      pts.push(
        `${k ? "L" : "M"}${(x0 + (x1 - x0) * nx).toFixed(2)} ${(r.y - yv).toFixed(2)}`,
      );
    }
    const line = pts.join(" ");
    const xEnd = x0 + (x1 - x0) * end;
    const fill = `${line} L${xEnd.toFixed(2)} ${r.y.toFixed(2)} L${x0.toFixed(2)} ${r.y.toFixed(2)} Z`;
    return { line, fill };
  });

  const hit = spring({
    frame: t - HIT,
    fps,
    config: { damping: 16, stiffness: 160, mass: 0.7 },
  });
  const hitO = interpolate(t, [HIT, HIT + 8], [0, 1], CLAMP);
  const capIn = interpolate(t, [HIT + 8, HIT + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const axisIn = interpolate(t, [10, 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const quiet = interpolate(t, [ACCENT_RISE, ACCENT_RISE + 24], [1, 0.62], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const stroke = Math.max(1, u);
  const axisY = yLast + 22 * u;
  const valueSize = 112 * u;

  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const hl = rows[n - 1];
  const auroraW = (x1 - x0) * 0.2;
  const auroraX = x0 + (x1 - x0) * (0.44 + hl.off) + auroraW * 0.15 * push;
  const auroraStops = p.aurora.map((c) => (c === "accent" ? accent : c));

  const ridgeEls: React.ReactNode[] = rows.map((r, idx) =>
    r.draw <= 0.01 ? null : (
      <g key={r.label + String(idx)}>
        <path d={paths[idx].fill} fill={p.bg} />
        {r.isHl && (
          <path
            d={paths[idx].fill}
            fill={`url(#${uid}-aurora)`}
            mask={`url(#${uid}-fade)`}
          />
        )}
        <path
          d={paths[idx].line}
          fill="none"
          stroke={r.isHl ? `url(#${uid}-aurora)` : p.line}
          strokeOpacity={r.isHl ? 1 : quiet}
          strokeWidth={(r.isHl ? 2.6 : 1.6) * u}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
    ),
  );

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${camScale})`,
          transformOrigin: "50% 55%",
        }}
      >
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={`${uid}-aurora`}
              gradientUnits="userSpaceOnUse"
              x1={auroraX - auroraW}
              y1={0}
              x2={auroraX + auroraW}
              y2={0}
            >
              {auroraStops.map((c, k) => (
                <stop
                  key={c}
                  offset={k / (auroraStops.length - 1)}
                  stopColor={c}
                />
              ))}
            </linearGradient>
            <linearGradient id={`${uid}-fadeg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity={p.tint} />
              <stop offset="1" stopColor="#fff" stopOpacity={0.03} />
            </linearGradient>
            <mask
              id={`${uid}-fade`}
              maskUnits="userSpaceOnUse"
              x={0}
              y={0}
              width={W}
              height={H}
            >
              <rect
                x={0}
                y={hl.y - accentH}
                width={W}
                height={accentH}
                fill={`url(#${uid}-fadeg)`}
              />
            </mask>
          </defs>
          {ridgeEls}
          <line
            x1={x0}
            x2={x0 + (x1 - x0) * axisIn}
            y1={axisY}
            y2={axisY}
            stroke={p.axis}
            strokeWidth={stroke}
          />
          {ticks.map((tk, k) => {
            const x = x0 + ((x1 - x0) * k) / Math.max(1, ticks.length - 1);
            return (
              <line
                key={tk}
                x1={x}
                x2={x}
                y1={axisY}
                y2={axisY + 6 * u}
                stroke={p.axis}
                strokeWidth={stroke}
                opacity={axisIn}
              />
            );
          })}
        </svg>

        {rows.map((r) => (
          <div
            key={`lab${r.i}`}
            style={{
              position: "absolute",
              left: x0 - 18 * u - 200 * u,
              width: 200 * u,
              top: r.y - 22 * u,
              textAlign: "right",
              fontFamily: bricolage,
              fontWeight: r.isHl ? 500 : 400,
              fontSize: 17 * u,
              lineHeight: `${22 * u}px`,
              letterSpacing: "-0.01em",
              color: r.isHl ? p.fg : p.muted,
              fontVariantNumeric: "tabular-nums",
              opacity: r.labelIn * (r.isHl ? 1 : 0.5 + 0.5 * quiet),
              transform: `translateX(${(1 - r.labelIn) * 8 * u}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {r.label}
          </div>
        ))}

        {ticks.map((tk, k) => {
          const x = x0 + ((x1 - x0) * k) / Math.max(1, ticks.length - 1);
          return (
            <div
              key={`t${tk}`}
              style={{
                position: "absolute",
                left: x - 40 * u,
                width: 80 * u,
                top: axisY + 12 * u,
                textAlign: "center",
                fontFamily: bricolage,
                fontWeight: 500,
                fontSize: 15 * u,
                color: p.muted,
                fontVariantNumeric: "tabular-nums",
                opacity: axisIn,
              }}
            >
              {tk}
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            right: W - x1,
            top: axisY + 38 * u,
            fontFamily: bricolage,
            fontWeight: 500,
            fontSize: 15 * u,
            color: p.muted,
            opacity: axisIn,
            whiteSpace: "nowrap",
          }}
        >
          {axisLabel}
        </div>

        {value ? (
          <div
            style={{
              position: "absolute",
              right: W - x1,
              top: H * 0.09,
              textAlign: "right",
              opacity: hitO,
              transform: `translateY(${(1 - hit) * 20 * u}px)`,
            }}
          >
            <div
              style={{
                fontFamily: bricolage,
                fontWeight: 400,
                fontSize: valueSize,
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
                color: p.fg,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {value}
            </div>
            <div
              style={{
                marginTop: 8 * u,
                fontFamily: bricolage,
                fontWeight: 500,
                fontSize: 20 * u,
                letterSpacing: "-0.01em",
                color: p.muted,
                opacity: capIn,
                transform: `translateY(${(1 - capIn) * 8 * u}px)`,
                whiteSpace: "nowrap",
              }}
            >
              {caption}
            </div>
          </div>
        ) : null}
      </AbsoluteFill>
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
