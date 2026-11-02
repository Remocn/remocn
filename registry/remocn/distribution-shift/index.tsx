"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface DistributionShiftProps {
  before?: number;
  after?: number;
  unit?: string;
  label?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

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
    axis: "rgba(255,255,255,0.22)",
    neutral: "#77767C",
    ghost: "rgba(255,255,255,0.32)",
    // gradients.sh "limb": ice lavender crest → violet → accent at the floor.
    ramp: ["#E9ECFF", "#8A8BFF"],
    stroke: "#C9CBFF",
    delta: "#A9AAFF",
    area: 0.22,
    glow: "rgba(75,43,214,0.42)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    axis: "rgba(18,18,20,0.22)",
    neutral: "#A9A7A1",
    ghost: "rgba(18,18,20,0.3)",
    ramp: ["#8A8BFF", "#4B2BD6"],
    stroke: "#4B2BD6",
    delta: "#4B2BD6",
    area: 0.16,
    glow: "rgba(138,139,255,0.22)",
    grain: 0.045,
  },
} as const;

const AXIS = [-16, 14] as const;
const RISE = -4;
const MARK = [34, 48] as const;
const MORPH = [64, 116] as const;
const HIT = MORPH[1];
const BINS = 96;
const Z99 = 2.326;
const SIGMA_BEFORE = 0.52;
const SIGMA_AFTER = 0.3;

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

function niceStep(max: number) {
  const raw = max / 5;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return n * pow;
}

function shape(p99: number, sigma: number) {
  return { mu: Math.log(p99) - Z99 * sigma, sigma };
}

function density(x: number, mu: number, sigma: number) {
  if (x <= 0) return 0;
  const z = (Math.log(x) - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (x * sigma);
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
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Readout({
  value,
  unit,
  size,
  color,
  unitColor,
}: {
  value: number;
  unit: string;
  size: number;
  color: string;
  unitColor: string;
}) {
  return (
    <span
      style={{
        fontFamily: sans,
        fontWeight: 400,
        fontSize: size,
        lineHeight: 0.92,
        letterSpacing: "-0.04em",
        color,
        fontVariantNumeric: "tabular-nums",
        whiteSpace: "nowrap",
      }}
    >
      {Math.round(value).toLocaleString("en-US")}
      <span
        style={{
          fontSize: size * 0.36,
          letterSpacing: "0em",
          color: unitColor,
          marginLeft: size * 0.04,
        }}
      >
        {unit}
      </span>
    </span>
  );
}

export function DistributionShift({
  before = 840,
  after = 120,
  unit = "ms",
  label = "p99 latency",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: DistributionShiftProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const hw = Math.max(1, u);

  const hi = Math.max(before, after);
  const step = niceStep(hi * 1.18);
  const axisMax = Math.ceil((hi * 1.12) / step) * step;
  const ticks = Array.from(
    { length: Math.round(axisMax / step) + 1 },
    (_, i) => i * step,
  );

  const L = width * 0.08;
  const R = width * 0.92;
  const base = height * 0.8;
  const top = height * 0.3;
  const xOf = (v: number) => L + (v / axisMax) * (R - L);

  const morph = interpolate(t, MORPH, [0, 1], { ...CLAMP, easing: EASE_IO });
  const sb = shape(before, SIGMA_BEFORE);
  const sa = shape(after, SIGMA_AFTER);
  const curveAt = (k: number) => {
    const mu = lerp(sb.mu, sa.mu, k);
    const sigma = lerp(SIGMA_BEFORE, SIGMA_AFTER, k);
    const peak = density(Math.exp(mu - sigma * sigma), mu, sigma);
    const h = lerp(0.3, 1, k) * (base - top);
    return (v: number) => (density(v, mu, sigma) / peak) * h;
  };
  const now = curveAt(morph);
  const was = curveAt(0);

  const markerV = Math.exp(lerp(Math.log(before), Math.log(after), morph));
  const markerX = xOf(markerV);
  const color = interpolateColors(morph, [0, 1], [p.neutral, p.stroke]);
  const gradId = `d${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const stops = [p.ramp[0], p.ramp[1], accent].map((c) =>
    interpolateColors(morph, [0, 1], [p.neutral, c]),
  );

  const axisK = interpolate(t, AXIS, [0, 1], { ...CLAMP, easing: EASE_IO });
  const markK = interpolate(t, MARK, [0, 1], { ...CLAMP, easing: EASE_OUT });
  const tagIn = interpolate(t, [MARK[0] + 6, MARK[1] + 8], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const ghostO = interpolate(t, [MORPH[0], MORPH[0] + 14], [0, 1], CLAMP);
  const kick = spring({
    frame: t - HIT,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.6 },
  });
  const after1 = interpolate(t, [HIT + 4, HIT + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const push = interpolate(t, [0, HIT + 54], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const closer = interpolate(t, [MORPH[0] + 16, HIT + 44], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const zoom = 1 + push * 0.025 + closer * 0.16;
  const pitch = (R - L) / BINS;
  const barW = pitch * 0.56;
  const bars = Array.from({ length: BINS }, (_, i) => {
    const v = ((i + 0.5) / BINS) * axisMax;
    const rise = interpolate(t, [RISE + i * 0.3, RISE + i * 0.3 + 16], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    const h = now(v) * rise;
    const x = L + i * pitch + (pitch - barW) / 2;
    const tail = v > markerV;
    return { key: i, x, h, tail };
  });

  const samples = 260;
  const path = (fn: (v: number) => number, k: number) =>
    Array.from({ length: samples + 1 }, (_, i) => {
      const v = (i / samples) * axisMax * k;
      return `${i ? "L" : "M"}${xOf(v).toFixed(2)} ${(base - fn(v)).toFixed(2)}`;
    }).join(" ");
  const strokeK = interpolate(t, [RISE + 2, RISE + 40], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const ghostMarkX = xOf(before);
  const ghostTop = base - (base - top) * 0.5;
  const markTop = top - 12 * u;
  const drop = Math.round((1 - after / before) * 100);
  const modeX = xOf(
    Math.exp(
      lerp(sb.mu, sa.mu, morph) - lerp(SIGMA_BEFORE, SIGMA_AFTER, morph) ** 2,
    ),
  );
  const glowX = ((width * 0.3 + (modeX - width * 0.3) * zoom) / width) * 100;
  const heroScale = 1 + 0.04 * (1 - kick) * (t >= HIT ? 1 : 0);

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(${16 + 14 * (1 - morph)}% ${46 - 6 * morph}% at ${glowX}% 74%, ${p.glow}, transparent 70%)`,
          opacity: 0.2 + 0.8 * morph,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "30% 70%",
        }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={top - 16 * u}
              x2={0}
              y2={base}
            >
              <stop offset="0" stopColor={stops[0]} />
              <stop offset="0.42" stopColor={stops[1]} />
              <stop offset="1" stopColor={stops[2]} />
            </linearGradient>
          </defs>
          <path
            d={`${path(now, 1)} L ${xOf(axisMax).toFixed(2)} ${base} L ${L} ${base} Z`}
            fill={`url(#${gradId})`}
            opacity={p.area * strokeK}
          />
          {bars.map((b) =>
            b.h > 0.2 ? (
              <rect
                key={b.key}
                x={b.x}
                y={base - b.h}
                width={barW}
                height={b.h}
                rx={Math.min(barW / 2, 1.5 * u)}
                fill={`url(#${gradId})`}
                opacity={b.tail ? 0.32 : 0.9}
              />
            ) : null,
          )}

          <path
            d={path(was, 1)}
            fill="none"
            stroke={p.ghost}
            strokeWidth={hw}
            strokeDasharray={`${3 * u} ${4 * u}`}
            opacity={ghostO}
          />
          <path
            d={path(now, strokeK)}
            fill="none"
            stroke={color}
            strokeWidth={2 * u}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          <line
            x1={L}
            y1={base}
            x2={lerp(L, R, axisK)}
            y2={base}
            stroke={p.axis}
            strokeWidth={hw}
          />
          {ticks.map((v, i) => {
            const a = interpolate(t, [4 + i * 2, 14 + i * 2], [0, 1], CLAMP);
            return (
              <line
                key={v}
                x1={xOf(v)}
                y1={base}
                x2={xOf(v)}
                y2={base + 6 * u}
                stroke={p.axis}
                strokeWidth={hw}
                opacity={a}
              />
            );
          })}

          <line
            x1={ghostMarkX}
            y1={base}
            x2={ghostMarkX}
            y2={ghostTop}
            stroke={p.ghost}
            strokeWidth={hw}
            strokeDasharray={`${3 * u} ${4 * u}`}
            opacity={ghostO}
          />
          <line
            x1={markerX}
            y1={base}
            x2={markerX}
            y2={lerp(base, markTop, markK)}
            stroke={p.fg}
            strokeWidth={hw * 1.2}
            opacity={markK > 0 ? 1 : 0}
          />
          <circle
            cx={markerX}
            cy={base}
            r={3.6 * u}
            fill={p.bg}
            stroke={p.fg}
            strokeWidth={hw * 1.4}
            opacity={markK}
          />
        </svg>

        {ticks.map((v, i) => {
          const a = interpolate(t, [4 + i * 2, 16 + i * 2], [0, 1], {
            ...CLAMP,
            easing: EASE_OUT,
          });
          return (
            <div
              key={v}
              style={{
                position: "absolute",
                left: xOf(v) - 60 * u,
                width: 120 * u,
                top: base + 14 * u,
                textAlign: "center",
                fontFamily: mono,
                fontWeight: 400,
                fontSize: 12 * u,
                color: p.muted,
                fontVariantNumeric: "tabular-nums",
                opacity: a,
                transform: `translateY(${(1 - a) * 5 * u}px)`,
              }}
            >
              {v.toLocaleString("en-US")}
              {i === ticks.length - 1 ? ` ${unit}` : ""}
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: ghostMarkX + 8 * u,
            top: ghostTop - 4 * u,
            fontFamily: mono,
            fontWeight: 400,
            fontSize: 12 * u,
            color: p.muted,
            fontVariantNumeric: "tabular-nums",
            opacity: ghostO,
            whiteSpace: "nowrap",
          }}
        >
          {before.toLocaleString("en-US")}
          {unit}
        </div>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: width * 0.3 + (markerX - width * 0.3) * zoom + 14 * u,
          top: height * 0.7 + (markTop - height * 0.7) * zoom - 4 * u,
          opacity: tagIn,
          transform: `translateY(${(1 - tagIn) * 10 * u}px)`,
        }}
      >
        <div
          style={{
            fontFamily: mono,
            fontWeight: 400,
            fontSize: 13 * u,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: p.muted,
            marginBottom: 12 * u,
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </div>
        <div
          style={{
            transform: `scale(${heroScale})`,
            transformOrigin: "0% 50%",
          }}
        >
          <Readout
            value={markerV}
            unit={unit}
            size={104 * u}
            color={p.fg}
            unitColor={p.muted}
          />
        </div>
        <div
          style={{
            marginTop: 14 * u,
            display: "flex",
            alignItems: "baseline",
            gap: 10 * u,
            fontFamily: sans,
            fontWeight: 400,
            fontSize: 20 * u,
            fontVariantNumeric: "tabular-nums",
            opacity: after1,
            transform: `translateY(${(1 - after1) * 8 * u}px)`,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ color: p.muted }}>
            from {before.toLocaleString("en-US")}
            {unit}
          </span>
          <span style={{ color: p.delta, fontWeight: 500 }}>
            {drop > 0 ? "−" : "+"}
            {Math.abs(drop)}%
          </span>
        </div>
      </div>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 64%, ${p.bg} 100%)`,
          opacity: 0.55,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
